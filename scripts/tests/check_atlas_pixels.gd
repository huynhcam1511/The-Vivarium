extends SceneTree

func _init() -> void:
	var img = Image.load_from_file("res://assets/tilesets/seamless_stylized_soil_atlas.png")
	if img:
		print("seamless_stylized_soil_atlas size: ", img.get_size())
		print("Pixel (0,0): ", img.get_pixel(0, 0))
		print("Pixel (16,16): ", img.get_pixel(16, 16))
		print("Pixel (31,31): ", img.get_pixel(31, 31))
		print("Pixel (32,0): ", img.get_pixel(32, 0))
		print("Pixel (48,16): ", img.get_pixel(48, 16))
	quit(0)
