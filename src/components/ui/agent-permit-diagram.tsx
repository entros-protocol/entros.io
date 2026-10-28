import {
  AgentGlyph,
  HumanGlyph,
  KeyGlyph,
  LiveGlyph,
  OnceGlyph,
} from "@/components/icons/glyphs";
import { FlowDiagram } from "@/components/ui/flow-diagram";

/** Owner-to-agent permit diagram. */
export function AgentPermitDiagram() {
  return (
    <FlowDiagram
      from={{ label: "Owner", Icon: HumanGlyph }}
      to={{ label: "Agent", Icon: AgentGlyph }}
      signal="signed permit"
      properties={[
        { label: "Single use", Icon: OnceGlyph },
        { label: "Key bound", Icon: KeyGlyph },
        { label: "Live check", Icon: LiveGlyph },
      ]}
    />
  );
}
