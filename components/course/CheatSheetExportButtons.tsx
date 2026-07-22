"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText, FileDown } from "lucide-react";
import { useState } from "react";

interface Props {
  content: string;
  courseTopic: string;
}

export default function CheatSheetExportButtons({ content, courseTopic }: Props) {
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const downloadMarkdown = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${courseTopic.replace(/\s+/g, "_")}_CheatSheet.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const element = document.getElementById("cheat-sheet-content");
    if (!element) return;
    
    // Quick trick to print only the cheat sheet
    const originalTitle = document.title;
    document.title = `${courseTopic.replace(/\s+/g, "_")}_CheatSheet`;
    
    // Add print specific styles dynamically
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        #cheat-sheet-content, #cheat-sheet-content * { visibility: visible; }
        #cheat-sheet-content { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; box-shadow: none; border: none; }
      }
    `;
    document.head.appendChild(style);
    
    window.print();
    
    // Cleanup
    document.head.removeChild(style);
    document.title = originalTitle;
  };

  return (
    <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={downloadMarkdown}>
            <FileDown className="w-4 h-4 mr-2" />
            Markdown
        </Button>
        <Button variant="outline" size="sm" onClick={downloadPDF} disabled={isExportingPDF}>
            <FileText className="w-4 h-4 mr-2" />
            {isExportingPDF ? "Exporting..." : "PDF"}
        </Button>
    </div>
  );
}
