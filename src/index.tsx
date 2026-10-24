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

function Content() {
  const [brightness, setValue] = useState(50);
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

  useEffect(() => {
    refresh();
  }, []);

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
    </PanelSection>
  );
}

function SegmentedRow({
  options,
}: {
  options: { label: string; onClick: () => void; active?: boolean }[];
}) {
  return (
    <Focusable style={{ display: "flex", gap: "4px", width: "100%" }}>
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
