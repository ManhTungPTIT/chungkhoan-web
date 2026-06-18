import "./styles/heatmap.scss";
import { useHeatmap } from "./hooks/useHeatmap";
import { buildTreemapData } from "./untils/treemapData";
import Heatmap from "./layouts/Heatmap";

export default function HeatmapPage() {
  const { data, isLoading, isError } = useHeatmap();

  if (isLoading) {
    return <div className="heatmap-state">Đang tải dữ liệu thị trường…</div>;
  }
  if (isError) {
    return (
      <div className="heatmap-state">Không tải được dữ liệu thị trường</div>
    );
  }

  const treeData = buildTreemapData(data);
  if (treeData.length === 0) {
    return <div className="heatmap-state">Không có dữ liệu</div>;
  }

  return (
    <div className="heatmap-page">
      <h2 className="heatmap-title">Bản đồ nhiệt thị trường</h2>
      <div className="heatmap-chart">
        <Heatmap data={treeData} />
      </div>
    </div>
  );
}
