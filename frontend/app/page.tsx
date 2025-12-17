'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";

type Document = {
  id: string;
  filename: string;
  uploadedAt: string;
  ocrResult?: {
    text: string;
    processedAt: string;
  };
};

export default function Dashboard() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const [ocrText, setOcrText] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error" | "info" | "">("");

  /* ================= AUTH ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
    else fetchDocuments();
  }, []);

  /* ================= DOCUMENTS ================= */
  async function fetchDocuments() {
    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/documents`
      );
      if (!res.ok) throw new Error();
      setDocuments(await res.json());
    } catch {
      setMessage("Erro ao buscar documentos");
      setMessageType("error");
    }
  }

  /* ================= UPLOAD ================= */
  async function handleUpload() {
    if (!file) {
      setMessage("Selecione um arquivo");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("Enviando documento...");
    setMessageType("info");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/documents/upload`,
        { method: "POST", body: formData }
      );

      if (!res.ok) throw new Error();

      setMessage("Documento enviado com sucesso");
      setMessageType("success");
      setFile(null);
      fetchDocuments();
    } catch {
      setMessage("Erro no upload");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  /* ================= OCR ================= */
  async function handleOCR(doc: Document) {
    setLoading(true);
    setAnswer("");
    setQuestion("");

    try {
      if (doc.ocrResult?.text) {
        setSelectedDoc(doc);
        setOcrText(doc.ocrResult.text);
        return;
      }

      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ocr/process/${doc.id}`,
        { method: "POST" }
      );

      if (!res.ok) throw new Error();

      const data = await res.json();

      setSelectedDoc(doc);
      setOcrText(data.text);

      setDocuments(prev =>
        prev.map(d =>
          d.id === doc.id
            ? {
              ...d,
              ocrResult: {
                text: data.text,
                processedAt: new Date().toISOString(),
              },
            }
            : d
        )
      );
    } catch {
      setMessage("Erro ao processar OCR");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  /* ================= DOWNLOAD PDF ================= */
  async function handleDownload(doc: Document) {
    setLoading(true);
    setMessage("Gerando PDF...");
    setMessageType("info");

    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/documents/${doc.id}/download`
      );

      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.filename}-ocr-llm.pdf`;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);

      setMessage("PDF baixado com sucesso");
      setMessageType("success");
    } catch {
      setMessage("Erro ao baixar PDF");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  /* ================= LLM ================= */
  async function handleAskLLM() {
    if (!selectedDoc || !question || !ocrText) return;

    setLoading(true);
    setMessage("Consultando LLM...");
    setMessageType("info");

    const prompt = `
Você é um assistente especializado em explicar documentos para usuários leigos.
Responda de forma clara, objetiva e em português.

=== TEXTO DO DOCUMENTO ===
${ocrText}

=== PERGUNTA DO USUÁRIO ===
${question}
`;

    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/llm/explain`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: selectedDoc.id,
            prompt,
          }),
        }
      );

      if (!res.ok) throw new Error();

      const data = await res.json();
      setAnswer(data.answer);

      setMessage("Resposta recebida");
      setMessageType("success");
    } catch {
      setMessage("Erro ao consultar LLM");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  /* ================= LOGOUT ================= */
  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  /* ================= UI ================= */
  return (
    <main className="flex min-h-screen flex-col items-center p-8 gap-6">
      {/* Header */}
      <div className="flex w-full max-w-md justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Logout
        </button>
      </div>

      {/* Upload */}
      <div className="border p-4 rounded w-full max-w-md flex flex-col gap-2">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="border p-2 rounded"
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className="bg-black text-white py-2 rounded disabled:opacity-50"
        >
          Enviar documento
        </button>
        {message && (
          <p
            className={
              messageType === "success"
                ? "text-green-500"
                : messageType === "error"
                  ? "text-red-500"
                  : "text-blue-500"
            }
          >
            {message}
          </p>
        )}
      </div>

      {/* Documents */}
      <div className="w-full max-w-md">
        <h2 className="font-bold mb-2">Meus documentos</h2>
        <ul className="space-y-2">
          {documents.map(doc => (
            <li
              key={doc.id}
              className="border p-2 rounded flex justify-between items-center"
            >
              <div>
                <p>{doc.filename}</p>
                <small>{new Date(doc.uploadedAt).toLocaleString()}</small>
                <p className="text-xs text-gray-500">
                  {doc.ocrResult ? "OCR processado" : "OCR pendente"}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOCR(doc)}
                  disabled={loading}
                  className="bg-blue-500 text-white px-2 rounded disabled:opacity-50"
                >
                  OCR
                </button>

                <button
                  onClick={() => handleDownload(doc)}
                  disabled={loading}
                  className="bg-purple-600 text-white px-2 rounded disabled:opacity-50"
                >
                  PDF
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* OCR + LLM */}
      {selectedDoc && (
        <div className="w-full max-w-md border p-4 rounded flex flex-col gap-2">
          <h2 className="font-bold">Texto extraído</h2>
          <textarea className="border p-2 h-32" value={ocrText} readOnly />

          <h2 className="font-bold">Pergunta</h2>
          <textarea
            className="border p-2 h-24"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Faça uma pergunta sobre o documento"
          />

          <button
            onClick={handleAskLLM}
            disabled={loading || !ocrText}
            className="bg-green-600 text-white py-2 rounded disabled:opacity-50"
          >
            Perguntar
          </button>

          {answer && (
            <>
              <h2 className="font-bold">Resposta</h2>
              <textarea
                className="border p-2 h-32 bg-gray-100 text-black"
                value={answer}
                readOnly
              />
            </>
          )}
        </div>
      )}
    </main>
  );
}