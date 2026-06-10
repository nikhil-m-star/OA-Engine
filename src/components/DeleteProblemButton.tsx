"use client";

import React, { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeleteProblemButtonProps {
  slug: string;
  title: string;
}

export default function DeleteProblemButton({ slug, title }: DeleteProblemButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      setIsDeleting(true);
      try {
        const res = await fetch(`/api/problems/${slug}`, {
          method: "DELETE",
        });
        if (res.ok) {
          alert("Problem deleted successfully.");
          router.refresh(); // Triggers server component refresh
        } else {
          const json = await res.json();
          alert(`Failed to delete: ${json.error}`);
        }
      } catch (err) {
        alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center justify-center w-7 h-7 bg-[#4a151b]/40 hover:bg-red-600 rounded-full text-red-400 hover:text-white transition-all shadow border border-red-500/20 disabled:opacity-50"
      title="Delete Problem"
    >
      {isDeleting ? (
        <Loader2 size={11} className="animate-spin" />
      ) : (
        <Trash2 size={11} />
      )}
    </button>
  );
}
