'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";

type Document = {
  id: string;
  filename: string;
  uploadedAt: string;
};

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info" | "">("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      fetchDocuments();
    }
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

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
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
            <li key={doc.id} className="border p-2 rounded">
              <p>{doc.filename}</p>
              <small>{new Date(doc.uploadedAt).toLocaleString()}</small>
            </li>
          ))}
          {documents.length === 0 && <p>Nenhum documento enviado ainda.</p>}
        </ul>
      </div>
    </main>
  );
}