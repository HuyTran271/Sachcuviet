// Dữ liệu minh họa cho giao diện, chưa kết nối API sách.
export const categories = [
  { id: 'van-hoc', name: 'Văn học', icon: 'book', description: 'Những câu chuyện ở lại cùng bạn', tone: 'sage' },
  { id: 'ky-nang', name: 'Kỹ năng sống', icon: 'sun', description: 'Một chút tốt hơn mỗi ngày', tone: 'peach' },
  { id: 'kinh-te', name: 'Kinh tế', icon: 'chart', description: 'Mở rộng tư duy, thêm góc nhìn', tone: 'sand' },
  { id: 'thieu-nhi', name: 'Thiếu nhi', icon: 'star', description: 'Nuôi dưỡng những tâm hồn nhỏ', tone: 'lavender' },
  { id: 'giao-trinh', name: 'Giáo trình', icon: 'study', description: 'Tiếp nối hành trình tri thức', tone: 'blue' },
  { id: 'ngoai-ngu', name: 'Ngoại ngữ', icon: 'globe', description: 'Một ngôn ngữ, một thế giới mới', tone: 'rose' },
];

export const books = [
  { id: 'b01', coverImage: '/images/books/nha-gia-kim.jpg', title: 'Nhà giả kim', author: 'Paulo Coelho', category: 'van-hoc', price: 45000, originalPrice: 79000, condition: 'Còn rất mới', location: 'Hà Nội', postedAt: '2026-11-16T08:00:00+07:00', recommended: true, seller: 'Tủ sách của An', description: 'Một câu chuyện về hành trình theo đuổi ước mơ và lắng nghe tiếng nói bên trong mình.', note: 'Sách đã đọc một lần, bìa và gáy còn đẹp. Có vài dấu gấp nhẹ ở góc trang.' },
  { id: 'b02', coverImage: '/images/books/cay-cam-ngot-cua-toi.jpg', title: 'Cây cam ngọt của tôi', author: 'José Mauro de Vasconcelos', category: 'van-hoc', price: 65000, originalPrice: 108000, condition: 'Như mới', location: 'TP. Hồ Chí Minh', postedAt: '2026-11-15T16:00:00+07:00', recommended: true, seller: 'Góc đọc nhỏ', description: 'Thế giới tuổi thơ của cậu bé Zezé, dịu dàng và đầy cảm xúc, qua những điều bình dị nhất.', note: 'Trang sách sạch, không ghi chú. Bìa có bọc bảo vệ.' },
  { id: 'b03', coverImage: '/images/books/di-tim-le-song.jpg', title: 'Đi tìm lẽ sống', author: 'Viktor E. Frankl', category: 'ky-nang', price: 48000, originalPrice: 88000, condition: 'Còn rất mới', location: 'Đà Nẵng', postedAt: '2026-11-14T09:00:00+07:00', recommended: true, seller: 'Trạm sách Đà Nẵng', description: 'Những suy ngẫm về ý nghĩa cuộc sống và khả năng tìm thấy hy vọng trong nghịch cảnh.', note: 'Sách đầy đủ trang, có gạch chân một số đoạn bằng bút chì.' },
  { id: 'b04', coverImage: '/images/books/tam-ly-hoc-ve-tien.jpg', title: 'Tâm lý học về tiền', author: 'Morgan Housel', category: 'kinh-te', price: 78000, originalPrice: 189000, condition: 'Còn rất mới', location: 'Hà Nội', postedAt: '2026-11-13T11:00:00+07:00', recommended: true, seller: 'Sách & Cà phê', description: 'Những câu chuyện về cách cảm xúc và thói quen ảnh hưởng đến quyết định tài chính.', note: 'Bìa mềm, gáy chắc. Mép sách hơi ngả màu theo thời gian.' },
  { id: 'b05', coverImage: '/images/books/de-men-phieu-luu-ky.jpg', coverRatio: 0.766, title: 'Dế Mèn phiêu lưu ký', author: 'Tô Hoài', category: 'thieu-nhi', price: 35000, originalPrice: 65000, condition: 'Còn rất mới', location: 'Cần Thơ', postedAt: '2026-11-16T07:00:00+07:00', seller: 'Tủ sách Mầm Xanh', description: 'Theo chân Dế Mèn bước vào thế giới thiên nhiên, tình bạn và những bài học trưởng thành.', note: 'Bản có minh họa, không rách trang, bìa trầy nhẹ.' },
  { id: 'b06', coverImage: '/images/books/tuoi-tre-dang-gia-bao-nhieu.jpg', title: 'Tuổi trẻ đáng giá bao nhiêu?', author: 'Rosie Nguyễn', category: 'ky-nang', price: 42000, originalPrice: 90000, condition: 'Đã qua sử dụng', location: 'TP. Hồ Chí Minh', postedAt: '2026-11-15T18:30:00+07:00', seller: 'Một trang mới', description: 'Những chia sẻ gần gũi về việc học, làm và khám phá bản thân trong những năm tháng tuổi trẻ.', note: 'Có ghi chú nhỏ ở trang đầu và một vài đoạn được đánh dấu.' },
  { id: 'b07', coverImage: '/images/books/english-grammar-in-use.jpg', coverRatio: 0.74, title: 'English Grammar in Use', author: 'Raymond Murphy', category: 'ngoai-ngu', price: 95000, originalPrice: 178000, condition: 'Còn rất mới', location: 'Hà Nội', postedAt: '2026-11-15T12:00:00+07:00', seller: 'Sách của Linh', description: 'Tài liệu luyện ngữ pháp tiếng Anh với phần giải thích và bài tập theo từng chủ điểm.', note: 'Một số bài tập đã làm bằng bút chì. Không kèm mã học trực tuyến.' },
  { id: 'b08', coverImage: '/images/books/nhap-mon-lap-trinh.jpg', coverPosition: 'left center', title: 'Nhập môn lập trình', author: 'Tài liệu học tập', category: 'giao-trinh', price: 55000, originalPrice: 110000, condition: 'Đã qua sử dụng', location: 'Đà Nẵng', postedAt: '2026-11-14T15:00:00+07:00', seller: 'Tủ sách sinh viên', description: 'Tài liệu minh họa dành cho người mới bắt đầu học tư duy thuật toán và lập trình.', note: 'Có ghi chú bên lề, đầy đủ trang. Đây là tựa sách mẫu dùng để thiết kế giao diện.' },
  { id: 'b09', coverImage: '/images/books/mat-biec.jpg', title: 'Mắt biếc', author: 'Nguyễn Nhật Ánh', category: 'van-hoc', price: 50000, originalPrice: 110000, condition: 'Như mới', location: 'Huế', postedAt: '2026-11-12T10:00:00+07:00', seller: 'Hiên nhà có sách', description: 'Một câu chuyện về tình yêu, ký ức tuổi thơ và những miền quê thân thuộc.', note: 'Sách được giữ trong tủ kín, không ghi chú hay gấp trang.' },
  { id: 'b10', coverImage: '/images/books/hoang-tu-be.jpg', title: 'Hoàng tử bé', author: 'Antoine de Saint-Exupéry', category: 'thieu-nhi', price: 32000, originalPrice: 70000, condition: 'Còn rất mới', location: 'Hà Nội', postedAt: '2026-11-11T09:00:00+07:00', seller: 'Góc đọc nhỏ', description: 'Chuyến du hành nhỏ mở ra những suy ngẫm lớn về tình bạn, yêu thương và sự gắn bó.', note: 'Bản tiếng Việt, bìa mềm, có minh họa màu.' },
  { id: 'b11', coverImage: '/images/books/tu-duy-nhanh-va-cham.jpg', coverRatio: 0.735, title: 'Tư duy nhanh và chậm', author: 'Daniel Kahneman', category: 'kinh-te', price: 85000, originalPrice: 239000, condition: 'Đã qua sử dụng', location: 'TP. Hồ Chí Minh', postedAt: '2026-11-10T14:00:00+07:00', seller: 'Sách & Cà phê', description: 'Khám phá hai cách tư duy và những thiên kiến thường gặp khi con người đưa ra quyết định.', note: 'Gáy có nếp đọc, một vài trang được đánh dấu bằng bút nhớ.' },
  { id: 'b12', coverImage: '/images/books/tu-hoc-tieng-nhat.jpg', title: 'Tự học tiếng Nhật', author: 'Tài liệu học tập', category: 'ngoai-ngu', price: 60000, originalPrice: 120000, condition: 'Còn rất mới', location: 'Hải Phòng', postedAt: '2026-11-09T10:00:00+07:00', seller: 'Tủ sách của Mai', description: 'Tựa sách mẫu cho nhóm ngoại ngữ, dành cho hành trình làm quen với tiếng Nhật.', note: 'Bìa mềm, không kèm đĩa nghe. Thông tin dùng để minh họa giao diện.' },
];

export const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export const normalizeSearch = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

export function filterBooks({ query = '', category = 'all', sort = 'newest', savedIds = null } = {}) {
  const search = normalizeSearch(query);
  const result = books.filter((book) =>
    (category === 'all' || book.category === category) &&
    (!savedIds || savedIds.includes(book.id)) &&
    normalizeSearch(`${book.title} ${book.author}`).includes(search),
  );
  return result.sort((a, b) => sort === 'price-asc' ? a.price - b.price : sort === 'price-desc' ? b.price - a.price : Date.parse(b.postedAt) - Date.parse(a.postedAt));
}
