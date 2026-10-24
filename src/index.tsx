import {
  callable,
  definePlugin
} from "@decky/api";
import {
  DialogButton,
  Focusable,
  PanelSection,
  PanelSectionRow
} from "@decky/ui";
import { useEffect, useState } from "react";
import { FaSun } from "react-icons/fa";

const getBrightness =
  callable<[], string>("getBrightness");

const setBrightness =
  callable<[value: number], { success: boolean; brightness: number }>(
    "setBrightness"
  );

const getInputSource =
  callable<[], string>("getInputSource");

const setInputSource =
  callable<[value: number], { success: boolean; input: number }>(
    "setInputSource"
  );

// VCP 0x60 values
const INPUT_SOURCES = [
  { label: "HDMI", value: 0x11 },
  { label: "DisplayPort", value: 0x0f },
  { label: "USB-C", value: 0x1b },
];

function Content() {
  const [brightness, setValue] = useState(50);
  const [input, setInput] = useState<number | null>(null);
  const [status, setStatus] = useState("Reading brightness…");

  async function refresh() {
    try {
      const result = await getBrightness();
      const match = result.match(/current value =\s*(\d+)/);
      if (match) {
        const current = Number(match[1]);
        setValue(current);
        setStatus(`Brightness: ${current}%`);
      } else {
        setStatus(result);
      }
    } catch (error) {
      setStatus(String(error));
    }
  }

  async function refreshInput() {
    try {
      const result = await getInputSource();
      const match = result.match(/sl=0x([0-9a-fA-F]+)/);
      if (match) {
        setInput(parseInt(match[1], 16));
      }
    } catch (error) {
      setStatus(String(error));
    }
  }

  useEffect(() => {
    refresh();
    refreshInput();
  }, []);

  async function changeInput(value: number) {
    try {
      const result = await setInputSource(value);
      setInput(result.input);
      setStatus(`Input: ${INPUT_SOURCES.find((s) => s.value === result.input)?.label}`);
    } catch (error) {
      setStatus(String(error));
    }
  }

  async function change(value: number) {
    value = Math.max(0, Math.min(100, value));
    try {
      const result = await setBrightness(value);
      setValue(result.brightness);
      setStatus(`Brightness: ${result.brightness}%`);
    } catch (error) {
      setStatus(String(error));
    }
  }

  return (
    <PanelSection title="DDCutil">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <PanelSectionRow>
            <div>{status}</div>
          </PanelSectionRow>

          <PanelSectionRow>
            <SegmentedRow
              options={[
                { label: "0%", onClick: () => change(0), active: brightness === 0 },
                { label: "50%", onClick: () => change(50), active: brightness === 50 },
                { label: "100%", onClick: () => change(100), active: brightness === 100 },
              ]}
            />
          </PanelSectionRow>

          <PanelSectionRow>
            <SegmentedRow
              options={[
                { label: "−10", onClick: () => change(brightness - 10) },
                { label: "+10", onClick: () => change(brightness + 10) },
              ]}
            />
          </PanelSectionRow>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <PanelSectionRow>
            <div>Input source</div>
          </PanelSectionRow>

          <PanelSectionRow>
            <SegmentedRow
              vertical
              gap="8px"
              options={INPUT_SOURCES.map((source) => ({
                label: source.label,
                onClick: () => changeInput(source.value),
                active: input === source.value,
              }))}
            />
          </PanelSectionRow>
        </div>
      </div>
    </PanelSection>
  );
}

function SegmentedRow({
  options,
  vertical = false,
  gap = "4px",
}: {
  options: { label: string; onClick: () => void; active?: boolean }[];
  vertical?: boolean;
  gap?: string | number;
}) {
  return (
    <Focusable
      style={{
        display: "flex",
        flexDirection: vertical ? "column" : "row",
        gap,
        width: "100%",
      }}
    >
      {options.map((option) => (
        <DialogButton
          key={option.label}
          style={{
            flex: 1,
            minWidth: 0,
            height: "48px",
            padding: "0 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: option.active ? "rgba(255, 255, 255, 0.3)" : undefined,
          }}
          onClick={option.onClick}
        >
          {option.label}
        </DialogButton>
      ))}
    </Focusable>
  );
}

export default definePlugin(() => ({
  name: "DDCutil",
  titleView: <div>DDCutil</div>,
  icon: <FaSun />,
  content: <Content />,
}));
