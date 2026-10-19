extends SceneTree

func _init() -> void:
	var img1 = Image.load_from_file("res://assets/tilesets/organic_soil_tileset.png")
	if img1:
		print("organic_soil_tileset size: ", img1.get_size())
	var img2 = Image.load_from_file("res://assets/tilesets/stylized_subterranean_atlas.png")
	if img2:
		print("stylized_subterranean_atlas size: ", img2.get_size())
	var img3 = Image.load_from_file("res://assets/sprites/stylized_handpainted_soil.png")
	if img3:
		print("stylized_handpainted_soil size: ", img3.get_size())
	var img4 = Image.load_from_file("res://assets/sprites/stylized_ant.png")
	if img4:
		print("stylized_ant size: ", img4.get_size())
	var img5 = Image.load_from_file("res://assets/sprites/stylized_bee.png")
	if img5:
		print("stylized_bee size: ", img5.get_size())
	quit(0)
