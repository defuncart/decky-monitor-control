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

const getContrast =
  callable<[], string>("getContrast");

const setContrast =
  callable<[value: number], { success: boolean; contrast: number }>(
    "setContrast"
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
  const [contrast, setContrastValue] = useState<number | null>(null);
  const [input, setInput] = useState<number | null>(null);
  const [statusBrightness, setStatusBrightness] = useState("Reading brightness…");
  const [statusContrast, setStatusContrast] = useState("Reading contrast…");

  async function refresh() {
    try {
      const result = await getBrightness();
      const match = result.match(/current value =\s*(\d+)/);
      if (match) {
        const current = Number(match[1]);
        setValue(current);
        setStatusBrightness(`Brightness: ${current}%`);
      } else {
        setStatusBrightness(result);
      }
    } catch (error) {
      setStatusBrightness(String(error));
    }
  }

  async function refreshContrast() {
    try {
      const result = await getContrast();
      const match = result.match(/current value =\s*(\d+)/);
      if (match) {
        const current = Number(match[1]);
        setContrastValue(current);
        setStatusContrast(`Contrast: ${current}%`);
      } else {
        setStatusContrast(result);
      }
    } catch (error) {
      setStatusContrast(String(error));
    }
  }

  async function changeContrast(value: number) {
    try {
      const result = await setContrast(value);
      setContrastValue(result.contrast);
      setStatusContrast(`Contrast: ${result.contrast}%`);
    } catch (error) {
      setStatusContrast(String(error));
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
      console.error("DDCutil: failed to read input source", error);
    }
  }

  useEffect(() => {
    refresh();
    refreshContrast();
    refreshInput();
  }, []);

  async function changeInput(value: number) {
    try {
      const result = await setInputSource(value);
      setInput(result.input);
    } catch (error) {
      console.error("DDCutil: failed to set input source", error);
    }
  }

  async function change(value: number) {
    value = Math.max(0, Math.min(100, value));
    try {
      const result = await setBrightness(value);
      setValue(result.brightness);
      setStatusBrightness(`Brightness: ${result.brightness}%`);
    } catch (error) {
      setStatusBrightness(String(error));
    }
  }

  return (
    <PanelSection title="DDCutil">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <PanelSectionRow>
            <div>{statusBrightness}</div>
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
            <div>{statusContrast}</div>
          </PanelSectionRow>

          <PanelSectionRow>
            <SegmentedRow
              options={[0, 25, 50, 75, 100].map((value) => ({
                label: String(value),
                onClick: () => changeContrast(value),
                active: contrast === value,
              }))}
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
