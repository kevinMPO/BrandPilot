"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { NodeShell } from "./NodeShell";
import type { GraphNode } from "../types";

/** Fact-checking node (teal): is each factual claim of an angle source-backed? */
function VerificationNodeImpl({ data }: NodeProps<GraphNode>) {
  const event = data.event;
  if (event.type !== "verification") return null;
  const { grounded, claims } = event.payload;
  const supported = claims.filter((c) => c.supported).length;

  return (
    <NodeShell
      icon={grounded ? ShieldCheck : ShieldAlert}
      accent="node-verify"
      title={grounded ? "Ancrage des faits ✓" : "Ancrage incomplet ✗"}
      subtitle={
        claims.length === 0
          ? "aucune affirmation factuelle"
          : `${supported}/${claims.length} affirmation${claims.length > 1 ? "s" : ""} sourcée${supported > 1 ? "s" : ""}`
      }
      status={grounded ? "done" : "error"}
      hasSource={false}
    >
      {claims.length > 0 && (
        <p
          className={
            grounded
              ? "text-[10px] text-node-verify"
              : "text-[10px] font-medium text-destructive"
          }
        >
          {grounded
            ? "chaque chiffre tracé à une source réelle"
            : "une affirmation sans source → révision"}
        </p>
      )}
    </NodeShell>
  );
}

export const VerificationNode = memo(VerificationNodeImpl);
