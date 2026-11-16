export function validateDelivery(values) {
  const delivery = {
    fullName: String(values.fullName || '').trim(),
    phone: String(values.phone || '').replace(/[\s.-]/g, ''),
    address: String(values.address || '').trim(),
  };
  const errors = {};
  if (delivery.fullName.length < 2) errors.fullName = 'Vui lòng nhập họ tên người nhận (ít nhất 2 ký tự).';
  if (!/^(?:0|\+84)\d{9}$/.test(delivery.phone)) errors.phone = 'Nhập số điện thoại gồm 10 số, bắt đầu bằng 0 hoặc +84.';
  if (delivery.address.length < 10) errors.address = 'Vui lòng nhập địa chỉ nhận sách đầy đủ (ít nhất 10 ký tự).';
  return { delivery, errors };
}
