'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";

type Document = {
  id: string;
  filename: string;
  uploadedAt: string;
  ocrResult?: { text: string; processedAt: string };
};

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info" | "">("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [llmPrompt, setLlmPrompt] = useState("");
  const [llmResponse, setLlmResponse] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
    else fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`);
      if (!res.ok) throw new Error("Erro ao buscar documentos");
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error(err);
      setMessage("Erro ao buscar documentos");
      setMessageType("error");
    }
  }

  async function handleUpload() {
    if (!file) {
      setMessage("Selecione um arquivo antes de enviar");
      setMessageType("error");
      return;
    }
    setLoading(true);
    setMessage("Enviando documento...");
    setMessageType("info");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Erro no upload");
      setMessage("Documento enviado com sucesso!");
      setMessageType("success");
      setFile(null);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      setMessage("Erro ao enviar documento");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function handleProcessOCR(docId: string) {
    setLoading(true);
    setMessage("Processando OCR...");
    setMessageType("info");
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/ocr/process/${docId}`, {
        method: "POST",
        body: new FormData(), // se quiser mandar o arquivo, use file
      });
      if (!res.ok) throw new Error("Erro ao processar OCR");
      const data = await res.json();
      setOcrText(data.text);
      setSelectedDocId(docId);
      setMessage("OCR processado com sucesso!");
      setMessageType("success");
    } catch (err) {
      console.error(err);
      setMessage("Erro ao processar OCR");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function handleLLMExplain() {
    if (!selectedDocId || !llmPrompt) return;
    setLoading(true);
    setMessage("Consultando LLM...");
    setMessageType("info");
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/llm/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: selectedDocId, text: llmPrompt }),
      });
      if (!res.ok) throw new Error("Erro na LLM");
      const data = await res.json();
      setLlmResponse(data.explanation);
      setMessage("Resposta recebida!");
      setMessageType("success");
    } catch (err) {
      console.error(err);
      setMessage("Erro na LLM");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  async function handleDownload(docId: string, filename: string) {
    setLoading(true);
    setMessage("Gerando PDF...");
    setMessageType("info");

    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${docId}/download`);
      if (!res.ok) throw new Error("Erro ao gerar PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}-ocr.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage("PDF gerado com sucesso!");
      setMessageType("success");
    } catch (err) {
      console.error(err);
      setMessage("Erro ao gerar PDF");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 gap-6">
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
      <div className="flex flex-col items-center gap-2 border p-4 rounded w-full max-w-md">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="border p-2 w-full rounded bg-white text-black"
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className="px-4 py-2 bg-black text-white rounded w-full"
        >
          {loading ? "Enviando..." : "Enviar"}
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

      {/* Lista de documentos */}
      <div className="w-full max-w-md">
        <h2 className="text-xl font-bold mb-2">Meus Documentos</h2>
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="border p-2 rounded flex justify-between items-center">
              <div>
                <p>{doc.filename}</p>
                <small>{new Date(doc.uploadedAt).toLocaleString()}</small>
              </div>
              <button
                className="px-2 py-1 bg-blue-500 text-white rounded"
                onClick={() => handleProcessOCR(doc.id)}
              >
                OCR
              </button>
              <button
                className="px-2 py-1 bg-purple-500 text-white rounded ml-2"
                onClick={() => handleDownload(doc.id, doc.filename)}
              >
                Download PDF
              </button>
            </li>
          ))}
          {documents.length === 0 && <p>Nenhum documento enviado ainda.</p>}
        </ul>
      </div>

      {/* OCR & LLM */}
      {selectedDocId && (
        <div className="w-full max-w-md border p-4 rounded flex flex-col gap-2">
          <h2 className="font-bold text-lg">Texto OCR</h2>
          <textarea
            className="border p-2 w-full h-32 bg-white text-black"
            value={ocrText}
            readOnly
          />
          <h2 className="font-bold text-lg mt-2">Pergunte à LLM</h2>
          <textarea
            className="border p-2 w-full h-24"
            placeholder="Digite sua pergunta sobre o documento"
            value={llmPrompt}
            onChange={(e) => setLlmPrompt(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-green-500 text-white rounded"
            onClick={handleLLMExplain}
            disabled={loading}
          >
            {loading ? "Aguardando..." : "Perguntar"}
          </button>
          {llmResponse && (
            <textarea
              className="border p-2 w-full h-32 bg-gray-100 text-black"
              value={llmResponse}
              readOnly
            />
          )}
        </div>
      )}
    </main>
  );
}