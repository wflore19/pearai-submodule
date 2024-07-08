import {
  ArrowLeftEndOnRectangleIcon,
  CheckIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import styled from "styled-components";
import { defaultBorderRadius, vscEditorBackground } from "..";
import { isJetBrains, postToIde } from "../../util/ide";
import { WebviewIde } from "../../util/webviewIde";
import HeaderButtonWithText from "../HeaderButtonWithText";
import { CopyButton } from "./CopyButton";

const TopDiv = styled.div`
  position: sticky;
  top: 0;
  left: 100%;
  height: 0;
  width: 0;
  overflow: visible;
  z-index: 100;
`;

const SecondDiv = styled.div<{ bottom: boolean }>`
  position: absolute;
  ${(props) => (props.bottom ? "bottom: 3px;" : "top: -11px;")}
  right: 10px;
  display: flex;
  padding: 1px 2px;
  gap: 4px;
  border: 0.5px solid #8888;
  border-radius: ${defaultBorderRadius};
  background-color: ${vscEditorBackground};
`;

interface CodeBlockToolBarProps {
  text: string;
  bottom: boolean;
  language: string | undefined;
}

const terminalLanguages = ["bash", "sh"];
const commonTerminalCommands = [
  "npm",
  "pnpm",
  "yarn",
  "bun",
  "deno",
  "npx",
  "cd",
  "ls",
  "pwd",
  "pip",
  "python",
  "node",
  "git",
  "curl",
  "wget",
  "rbenv",
  "gem",
  "ruby",
  "bundle",
];
function isTerminalCodeBlock(language: string | undefined, text: string) {
  return (
    terminalLanguages.includes(language) ||
    (language?.length === 0 &&
      (text.trim().split("\n").length === 1 ||
        commonTerminalCommands.some((c) => text.trim().startsWith(c))))
  );
}

function CodeBlockToolBar(props: CodeBlockToolBarProps) {
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);

  return (
    <TopDiv>
      <SecondDiv bottom={props.bottom || false}>
        {isJetBrains() || (
          <>
            <HeaderButtonWithText
              text=""
              onClick={() => {
                postToIde("insertAtCursor", { text: props.text });
              }}
            >
              <ArrowLeftEndOnRectangleIcon className="w-4 h-4" /> Apply
            </HeaderButtonWithText>
          </>
        )}

        <CopyButton text={props.text} />
      </SecondDiv>
    </TopDiv>
  );
}

export default CodeBlockToolBar;
