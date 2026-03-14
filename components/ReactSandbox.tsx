"use client";

import { LiveProvider, LiveEditor, LiveError, LivePreview } from "react-live";

export default function ReactSandbox({ code }: { code: string }) {
  return (
    <div className="my-8 rounded-2xl overflow-hidden border bg-slate-950 text-slate-50 shadow-lg">
      <LiveProvider code={code}>
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Code Editor Pane */}
          <div className="p-4 border-b md:border-b-0 md:border-r border-slate-800 font-mono text-sm h-[350px] overflow-auto">
            <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">
              Editable Sandbox
            </div>
            <LiveEditor
              className="outline-none focus:outline-none"
              theme={{ plain: {}, styles: [] }}
            />
          </div>

          {/* Live Preview Pane */}
          <div className="p-4 bg-white text-black h-[350px] overflow-auto flex flex-col items-center justify-center relative">
            <div className="absolute top-2 left-4 text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Live Output
            </div>
            <LivePreview />
          </div>
        </div>

        {/* Error boundary for bad AI code or user typos */}
        <LiveError className="bg-red-950/50 text-red-400 p-4 text-sm font-mono border-t border-red-900/50 m-0" />
      </LiveProvider>
    </div>
  );
}
