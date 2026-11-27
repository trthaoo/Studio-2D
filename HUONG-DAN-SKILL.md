# Hướng dẫn dùng skill làm video (Antigravity + 2D Studio)

30 skill "công thức video", mỗi cái đo từng khung hình từ một short mẫu: cấu trúc kịch bản, nhịp kể, góc máy, chuyển
cảnh, bối cảnh, ánh sáng, nhân vật, chữ trên màn hình. AI dùng công thức để viết video **mới** theo chủ đề của bạn,
không chép nội dung video mẫu. Mỗi lần làm, AI tự đổi bề mặt (ánh sáng, shader, màu, bối cảnh, ngoại hình) để các
video không giống nhau.

## Chuẩn bị (một lần)
1. Mở thư mục **2D Studio** trong Antigravity (File > Open Folder). Skill nằm ở `.agents/skills/`, Antigravity tự thấy.
2. Chạy studio: `npm start` (mở http://localhost:5200).
3. (Nếu muốn có giọng đọc) Studio > tab Xuất video > Giọng đọc: chọn ElevenLabs, dán key của bạn.

## Cách gọi skill khi prompt
- Gõ `/` + tên skill + yêu cầu:
  `/v22-levels-arms-race tạo video về các cấp độ chống trộm của tiệm tạp hoá, thoại tiếng Việt, khoảng 50 giây`
- Hoặc nói tên skill trong câu:
  `Dùng skill v24-paradox-standoff làm video "Cà phê phin đấu cà phê máy", giọng kể hài hước`
- Chưa biết chọn skill nào:
  `/video-menu tôi muốn làm video về mẹo đi chợ, nên dùng skill nào?`
- Nên ghi rõ: chủ đề, ngôn ngữ thoại, độ dài, giọng kể (hài, nghiêm túc, bí ẩn...), nhân vật muốn có (nếu có).

## Sau khi AI làm xong
AI ghi plan vào `Projects/<tên video>/scene.json`. Trong studio:
1. Mở project đó (màn hình Projects). Studio tự vào tab **Kịch bản**, bảng bên phải là toàn bộ plan.
2. Duyệt và sửa: nhân vật, từng cảnh (bối cảnh, ánh sáng, shader, đồ vật), từng phân đoạn (câu thoại, biểu cảm, góc máy...).
   Ô "Độ khác biệt so với các video trước" nên từ 70% trở lên.
3. Bấm **Dựng vào "…" để xem** (xem trước, sửa tiếp trên timeline) hoặc **Duyệt và xuất video** (ra MP4 luôn).
4. Muốn AI sửa: chat tiếp trong Antigravity ("đổi cảnh 2 sang ban đêm", "thêm một cảnh ở chợ"), studio tự tải lại.

## 30 skill

| Skill | Dạng | Câu chuyện kiểu gì |
|---|---|---|
| `v01-rule-break-why` | Vì sao… | Một việc bình thường thành cấm kỵ ở nơi đặc biệt; người mới phá luật, hậu quả bí ẩn, rồi giải thích |
| `v02-paradox-twist-story` | Chuyện ngược đời | Ai đó làm việc tưởng vô nghĩa; mọi lý lẽ nói không thể, cuối cùng lộ ra thoả thuận ngầm bất ngờ |
| `v03-dud-delayed-payoff` | Cách nó từng hoạt động | Phát minh bị coi là đồ hỏng, đối thủ đem ra đùa, rồi cơ chế ẩn bên trong phát huy đúng lúc |
| `v04-backfire-named-effect` | Khoa học đằng sau | Cách sửa hiển nhiên lại làm tệ hơn, leo thang hài hước, cuối cùng gọi tên hiệu ứng tâm lý |
| `v05-con-double-reversal` | Mánh lừa | Kẻ bán làm giả giá trị lừa người giàu; chuyên gia vạch trần, nhưng người giàu mới là kẻ khôn |
| `v06-odd-prep-reveal` | Cách nó từng hoạt động | Một người chuẩn bị kỳ quặc bị cả nhóm chê, đến lúc nguy cấp thì chính nó cứu mọi người |
| `v07-scam-origin-story` | Mánh lừa | Kẻ lừa khai thác một luật ai cũng tin, làm ngày càng lớn, đến khi một món đồ nhỏ chặn đứng |
| `v08-rival-bodge-physics` | Khoa học đằng sau | Hai đối thủ chế cùng một máy; người hùng sửa tạm theo bản năng, đối thủ phá, vật lý phân xử |
| `v09-timed-experiment-flip` | Thí nghiệm | Một cách xử lý lạ có quy tắc thời gian chặt; kết quả khó tin, rồi bị đảo ngược khi quá giờ |
| `v10-flaw-saves-day` | Vì sao… | Người cố tình để một "lỗi" bị chê cười; thời gian trôi, lỗi đó lại là thứ cứu cả hệ thống |
| `v11-calm-oddball-why` | Vì sao… | Giữa hiểm nguy, một người bình thản làm việc tưởng điên; bị chế giễu, cuối cùng đúng |
| `v12-delayed-signal-con` | Mánh lừa | Kẻ bị coi thường chờ cả ngày rồi cược tất vào cửa thua; đồng phạm lợi dụng độ trễ thông tin |
| `v13-forbidden-loop-fable` | Ngụ ngôn | Cả cộng đồng xoay quanh một điều cấm; đứa trẻ tò mò phá lệ, và vòng lặp bắt đầu lại |
| `v14-reflex-paradox-why` | Vì sao… | Nhà vô địch thắng bằng một luật nghe ngược đời; bạn thử và thua ngay, rồi giải thích phản xạ |
| `v15-currency-world-tragedy` | Thế giới giả tưởng | Thế giới nơi một thứ vô hình là tiền; người nghèo bán dần nó để cứu người thân, cái giá cuối cùng |
| `v16-flaw-finder-story` | Chuyện có thật | Người bình thường thấy một kết quả lạ, soi đến khi tìm ra lỗ hổng, rồi lựa chọn bất ngờ |
| `v17-double-cross-tale` | Mánh lừa | Một thiết bị an toàn xưa dựng như truyện kinh dị; nạn nhân hoá ra dàn dựng, và bị lừa lại |
| `v18-caught-by-sting` | Cách nó từng hoạt động | Người được tin tưởng lặng lẽ ăn cắp vận may, mơ mộng, rồi sập bẫy; sau đó mới giải thích bẫy |
| `v19-you-live-it` | Nghề ít ai biết | Luật cấm cách phạt hiển nhiên, nên người ta nghĩ ra một "phần thưởng" trá hình; bạn sống thử |
| `v20-slow-squeeze-con` | Mánh lừa | Người lạ làm một việc nhỏ xíu lặp đi lặp lại, leo thang đến khi nạn nhân phải bỏ của chạy |
| `v21-ignored-warning-tale` | Chuyện có thật | Nhà phát minh tặng vua một thiết bị kèm lời cảnh báo; cả triều chế nhạo, đến khi nó đúng |
| `v22-levels-arms-race` | Các cấp độ | Hai phe leo thang một thứ từng cấp, cho đến bước ngoặt công nghệ và cấp cuối cực lố |
| `v23-loophole-trickster` | Lách luật | Kẻ bán "giấy phép" bị khách khôn hơn mua trước cho một việc chưa nói, rồi việc đó nhắm vào hắn |
| `v24-paradox-standoff` | Đối đầu | Kẻ trung gian bán cho hai phe hai món "bất khả chiến bại" mâu thuẫn nhau; cả hai đứng hình |
| `v25-analogy-explainer` | Khoa học đằng sau | Câu hỏi ngây ngô về một thứ quen thuộc, theo nó đi một vòng, rồi giải thích bằng ví von lớn |
| `v26-loophole-walkthrough` | Lách luật | Điều bị cấm mà vẫn diễn ra công khai; dẫn bạn đi qua từng bước đến cái kẽ hở bí mật |
| `v27-crack-it-open` | Khoa học đằng sau | Bạn cứ "suýt trúng"; mở máy ra xem bảng ẩn khiến suýt trúng xảy ra nhiều hơn trúng |
| `v28-experiment-twist` | Thí nghiệm | Nhà khoa học thử cực đoan một niềm tin phổ biến; ai cũng khẳng định đúng, số đo nói sai |
| `v29-case-analogy-why` | Vì sao… | Kẻ gian làm giả số liệu cho "ngẫu nhiên" vẫn bị bắt; một vật quen thuộc mô phỏng quy luật ẩn |
| `v30-odd-ritual-why` | Khoa học đằng sau | Một nghi thức kỳ quặc nghe như tự phá; từng bước, người nổi tiếng từng làm, và lý do trong não |

Skill nền `video-studio` (AI tự đọc) chứa quy trình, định dạng plan và phong cách chung đo được: khoảng 60 giây,
27 cú máy (mỗi cú khoảng 2 giây), 7 địa điểm, 96% lời dẫn, câu mở trong 4 giây đầu, phụ đề 1 từ.
