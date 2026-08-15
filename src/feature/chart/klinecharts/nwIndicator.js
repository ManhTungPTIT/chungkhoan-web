// "klinecharts" (entry CJS/UMD) không expose named export registerIndicator
// trong môi trường ESM (Node/Vitest) — import thẳng bản ESM để lấy đúng API.
import { registerIndicator } from "klinecharts/dist/index.esm.js";
import { calcNwTrend } from "../untils/indicators";

// Một màu duy nhất, KHÔNG tô theo hướng xu hướng: nền xanh/đỏ của BBS đã mã hoá
// hướng rồi, tô thêm là chồng hai cách nói lên cùng một sự thật.
const NW_COLOR = "#F59E0B";

// Tách khỏi registerIndicator để test được không cần chart/DOM.
// Warm-up trả {} chứ không phải null — klinecharts đòi phần tử là object.
export function calcNwFigures(dataList) {
  return calcNwTrend(dataList).map((point) => (point ? { nw: point.nw } : {}));
}

registerIndicator({
  name: "NW",
  shortName: "NW",
  precision: 2,
  figures: [{ key: "nw", title: "NW: ", type: "line" }],
  // styles.lines THAY THẾ toàn bộ default (không merge sâu) — phải đủ
  // style/smooth/size/dashedValue, thiếu dashedValue sẽ crash khi zoom
  styles: {
    lines: [
      {
        style: "solid",
        smooth: false,
        size: 1,
        dashedValue: [2, 2],
        color: NW_COLOR,
      },
    ],
  },
  calc: (dataList) => calcNwFigures(dataList),
});
