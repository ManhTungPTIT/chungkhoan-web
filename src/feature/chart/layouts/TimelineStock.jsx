import React, { useState } from 'react'


// Chỉ 8 khung vnstock (nguồn VCI) hỗ trợ sẵn. Token phải khớp INTERVALS ở
// backend (vnstock_realtime/intraday_service.py).
const TTIMELINELABEL = [
    {name:"1m", label: "1 phút"},
    {name:"5m", label: "5 phút"},
    {name:"15m", label: "15 phút"},
    {name:"30m", label: "30 phút"},
    {name:"1h", label: "1 giờ"},
    {name:"1d", label: "1 ngày"},
    {name:"1w", label: "1 tuần"},
    {name:"1mth", label: "1 tháng"},
]
function TimelineStock({activeTimeline, onSelect}) {
 const [open, setOpen] = useState(false);

   const handleSelect = (name) => {
     onSelect(name);
     setOpen(false); // single-select: chọn xong đóng dropdown
   };

   return (
     <div style={{ position: "relative", zIndex: 20 }}>
       <button
         type="button"
         className="timeline-stock__trigger"
         onClick={() => setOpen((o) => !o)}
         style={{
           display: "inline-flex",
           alignItems: "center",
           justifyContent: "center",
           gap: 4,
           minWidth: 56,
           padding: "4px 10px",
           fontSize: "0.8rem",
           border: "1px solid var(--border, #d6dae3)",
           borderRadius: 6,
           background: "#fff",
           color: "#1d2939",
           cursor: "pointer",
           whiteSpace: "nowrap",
         }}
       >
         ⏱ {activeTimeline} <span style={{ fontSize: "0.7rem" }}>▾</span>
       </button>
       {open && (
         <div
           style={{
             position: "absolute",
             top: "100%",
             right: 0,
             marginTop: 4,
             padding: "6px 4px",
             minWidth: 60,
             overflowY: "auto",
             background: "#fff",
             border: "1px solid #e6e8ef",
             borderRadius: 8,
             boxShadow: "0 6px 18px rgba(16,24,40,0.12)",
             textAlign: "left",
             textTransform: "none",
           }}
         >
           {TTIMELINELABEL.map((ind) => {
             const active = ind.name === activeTimeline;
             return (
               <button
               className='timeline-active'
                 type="button"
                 key={ind.name}
                 onClick={() => handleSelect(ind.name)}
                 style={{
                   display: "flex",
                   alignItems: "center",
                   gap: 8,
                   width: "100%",
                   padding: "5px 10px",
                   fontSize: "0.82rem",
                   cursor: "pointer",
                   borderRadius: 6,
                   border: "none",
                   textAlign: "left",
                   whiteSpace: "nowrap",
                   height: "2rem"
                 }}
               >
                 {ind.label}
               </button>
             );
           })}
         </div>
       )}
     </div>
   );
}

export default TimelineStock
