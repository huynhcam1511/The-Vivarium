extends Node

# The Living Vivarium - Story & Naturalist Chronicles Manager
signal journal_entry_unlocked(entry: Dictionary)

var journal_entries: Array[Dictionary] = [
	{
		"id": 1,
		"title": "Chương 1: Khởi nguồn của chiếc Vivarium",
		"date": "Ngày 1 - Mùa Thu",
		"content": "Một khúc gỗ lũa sồi cổ thụ phủ rêu xanh được đặt giữa tầng cạn. Dưới lớp kính acrylic tối màu, Kiến Chúa Camponotus đầu tiên đã chọn chiếc buồng ướt trung tâm để bắt đầu hạ sinh mẻ trứng ngọc trai đầu đời.",
		"unlocked": true
	},
	{
		"id": 2,
		"title": "Chương 2: Điệu múa của bầy Ong mật",
		"date": "Ngày 7 - Mùa Thu",
		"content": "Những đóa cúc dại trắng đầu tiên bung nở trên nền cát ẩm. Đàn ong mật Apis mellifera bắt đầu bay lượn, lách qua từng kẽ lá để mang những giỏ phấn hoa vàng óng về bọng cây.",
		"unlocked": true
	},
	{
		"id": 3,
		"title": "Chương 3: Kho ngũ cốc lòng đất",
		"date": "Ngày 14 - Mùa Thu",
		"content": "Kiến thợ đã dọn sạch kho khô bên phải, mang về hàng trăm hạt cỏ ba lá và yến mạch. Chúng tỉ mỉ xếp hạt thẳng tắp, tránh xa khoang ấp trứng ẩm mốc để bảo quản nguồn dinh dưỡng cho cả đàn.",
		"unlocked": false
	}
]

func get_unlocked_entries() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for entry in journal_entries:
		if entry["unlocked"]:
			result.append(entry)
	return result

func unlock_next_entry() -> void:
	for entry in journal_entries:
		if not entry["unlocked"]:
			entry["unlocked"] = true
			emit_signal("journal_entry_unlocked", entry)
			break
