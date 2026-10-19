extends CanvasLayer

# The Vivarium - Modern 16:9 Landscape Ecological HUD Controller
# Frosted-glass top bar, floating contextual toolbar, time dilation controls, and camera navigation

@onready var telemetry_label: Label = $TopMargin/HBox/AtmospherePill/Margin/HBox/TelemetryLabel
@onready var biome_label: Label = $TopMargin/HBox/AtmospherePill/Margin/HBox/BiomeLabel
@onready var weather_label: Label = $TopMargin/HBox/AtmospherePill/Margin/HBox/WeatherLabel

@onready var clay_label: Label = $TopResourceMargin/ResourcePill/Margin/HBox/ClayLabel
@onready var wax_label: Label = $TopResourceMargin/ResourcePill/Margin/HBox/WaxLabel
@onready var honey_label: Label = $TopResourceMargin/ResourcePill/Margin/HBox/HoneyLabel
@onready var protein_label: Label = $TopResourceMargin/ResourcePill/Margin/HBox/ProteinLabel
@onready var seed_label: Label = $TopResourceMargin/ResourcePill/Margin/HBox/SeedLabel
@onready var ant_label: Label = $TopResourceMargin/ResourcePill/Margin/HBox/AntLabel
@onready var bee_label: Label = $TopResourceMargin/ResourcePill/Margin/HBox/BeeLabel

@onready var btn_save: Button = $TopMargin/HBox/TopActions/BtnSave
@onready var btn_mode: Button = $TopMargin/HBox/TopActions/BtnMode
@onready var btn_terrain: Button = $TopMargin/HBox/TopActions/BtnTerrain


@onready var btn_nav_canopy: Button = $BottomLeftNav/Panel/Margin/HBox/BtnNavCanopy
@onready var btn_nav_surface: Button = $BottomLeftNav/Panel/Margin/HBox/BtnNavSurface
@onready var btn_nav_nest: Button = $BottomLeftNav/Panel/Margin/HBox/BtnNavNest

@onready var btn_dig: Button = $BottomCenterToolbar/Panel/Margin/HBox/BtnDig
@onready var btn_fill: Button = $BottomCenterToolbar/Panel/Margin/HBox/BtnFill
@onready var btn_cancel: Button = $BottomCenterToolbar/Panel/Margin/HBox/BtnCancel
@onready var btn_pheromone: Button = $BottomCenterToolbar/Panel/Margin/HBox/BtnPheromone
@onready var btn_honeys: Button = $BottomCenterToolbar/Panel/Margin/HBox/BtnHoneys
@onready var btn_journal: Button = $BottomCenterToolbar/Panel/Margin/HBox/BtnJournal
@onready var btn_hive: Button = $BottomQuickActions/Panel/Margin/HBox/BtnHive
@onready var btn_zoom_out: Button = $BottomQuickActions/Panel/Margin/HBox/BtnZoomOut
@onready var btn_zoom_in: Button = $BottomQuickActions/Panel/Margin/HBox/BtnZoomIn
@onready var btn_weather: Button = $BottomQuickActions/Panel/Margin/HBox/BtnWeather
@onready var btn_colony: Button = $BottomQuickActions/Panel/Margin/HBox/BtnColony
@onready var btn_help: Button = $BottomQuickActions/Panel/Margin/HBox/BtnHelp

@onready var btn_pause: Button = $BottomRightTime/Panel/Margin/HBox/BtnPause
@onready var btn_1x: Button = $BottomRightTime/Panel/Margin/HBox/Btn1x
@onready var btn_2x: Button = $BottomRightTime/Panel/Margin/HBox/Btn2x
@onready var btn_5x: Button = $BottomRightTime/Panel/Margin/HBox/Btn5x

@onready var toast_panel: MarginContainer = $ToastContainer
@onready var toast_label: Label = $ToastContainer/Panel/Margin/ToastLabel

@onready var journal_dialog: Window = $JournalDialog
@onready var journal_content: RichTextLabel = $JournalDialog/Margin/VBox/Content
@onready var priority_dialog: Window = $PriorityDialog
@onready var honey_dialog: Window = $HoneyDialog
@onready var honey_detail: Label = $HoneyDialog/Margin/VBox/HoneyDetail
@onready var mode_dialog: Window = $ModeDialog

var toast_timer: float = 0.0
var colony_dialog: AcceptDialog
var help_dialog: AcceptDialog

func _ready() -> void:
	_apply_visual_theme()
	# 1. Connect simulation signals
	GameManager.resources_updated.connect(_on_resources_updated)
	GameManager.climate_updated.connect(_on_climate_updated)
	GameManager.weather_changed.connect(_on_weather_changed)
	GameManager.colony_event.connect(_show_toast)
	GameManager.pheromone_priority_updated.connect(_on_pheromone_priority_updated)
	GameManager.mode_changed.connect(_on_mode_changed)
	GameManager.terrain_mode_changed.connect(_on_terrain_mode_changed)

	# 2. Wire navigation buttons
	btn_nav_canopy.pressed.connect(_on_nav_canopy_pressed)
	btn_nav_surface.pressed.connect(_on_nav_surface_pressed)
	btn_nav_nest.pressed.connect(_on_nav_nest_pressed)

	# 3. Wire tools
	btn_dig.pressed.connect(_on_tool_dig_pressed)
	btn_fill.pressed.connect(_on_tool_fill_pressed)
	btn_cancel.pressed.connect(_on_tool_cancel_pressed)
	btn_pheromone.pressed.connect(func(): priority_dialog.popup_centered())
	btn_honeys.pressed.connect(func(): _update_honey_dialog(); honey_dialog.popup_centered())
	btn_journal.pressed.connect(_on_btn_journal_pressed)
	btn_hive.pressed.connect(func(): _camera_action("go_to_hive"))
	btn_zoom_out.pressed.connect(func(): _camera_action("zoom_out"))
	btn_zoom_in.pressed.connect(func(): _camera_action("zoom_in"))
	btn_weather.pressed.connect(_cycle_weather)
	btn_colony.pressed.connect(_show_colony_dialog)
	btn_help.pressed.connect(func(): help_dialog.popup_centered())

	# 4. Wire time controls
	btn_pause.pressed.connect(func(): GameManager.set_time_scale(0.0))
	btn_1x.pressed.connect(func(): GameManager.set_time_scale(1.0))
	btn_2x.pressed.connect(func(): GameManager.set_time_scale(2.0))
	btn_5x.pressed.connect(func(): GameManager.set_time_scale(5.0))

	# 5. Wire top actions
	btn_save.pressed.connect(func(): FirebaseSync.save_game_all("Thao tác người chơi"))
	btn_mode.pressed.connect(func(): mode_dialog.popup_centered())
	btn_terrain.pressed.connect(func(): GameManager.toggle_terrain_mode())


	# 6. Wire priority dialog presets
	$PriorityDialog/Margin/VBox/BtnPresetBalanced.pressed.connect(func():
		GameManager.set_pheromone_priority(0.40, 0.30, 0.20, 0.10, "LINEAR")
		priority_dialog.visible = false
	)
	$PriorityDialog/Margin/VBox/BtnPresetDig.pressed.connect(func():
		GameManager.set_pheromone_priority(0.20, 0.10, 0.60, 0.10, "EXPO")
		priority_dialog.visible = false
	)
	$PriorityDialog/Margin/VBox/BtnPresetBrood.pressed.connect(func():
		GameManager.set_pheromone_priority(0.10, 0.50, 0.10, 0.30, "EXPO")
		priority_dialog.visible = false
	)
	$PriorityDialog/Margin/VBox/BtnPresetForage.pressed.connect(func():
		GameManager.set_pheromone_priority(0.20, 0.20, 0.0, 0.60, "EXPO")
		priority_dialog.visible = false
	)

	# 7. Wire mode dialog presets
	$ModeDialog/Margin/VBox/BtnModeLiving.pressed.connect(func():
		GameManager.set_game_mode("LIVING")
		mode_dialog.visible = false
	)
	$ModeDialog/Margin/VBox/BtnModeSurvival.pressed.connect(func():
		GameManager.set_game_mode("SURVIVAL")
		mode_dialog.visible = false
	)

	# 8. Initial state
	_update_all_labels()
	_update_tool_buttons()
	toast_panel.visible = false
	journal_dialog.visible = false
	priority_dialog.visible = false
	honey_dialog.visible = false
	mode_dialog.visible = false
	colony_dialog = AcceptDialog.new()
	colony_dialog.title = "Thông tin đàn"
	colony_dialog.min_size = Vector2i(430, 270)
	add_child(colony_dialog)
	help_dialog = AcceptDialog.new()
	help_dialog.title = "Điều khiển Vivarium"
	help_dialog.min_size = Vector2i(490, 260)
	help_dialog.dialog_text = "Chuột phải/giữa hoặc WASD: kéo camera\nCon lăn hoặc nút +/−: phóng to, thu nhỏ\n1/2/3: tới tán cây, mặt đất, tổ kiến\nĐào/Lấp: chọn công cụ rồi nhấp vào ô đất\nHủy: nhấp ô đã đánh dấu để bỏ lệnh\nR: đặt lại camera · F11: toàn màn hình"
	add_child(help_dialog)

func _apply_visual_theme() -> void:
	var panel_style := StyleBoxFlat.new()
	panel_style.bg_color = Color(0.075, 0.105, 0.095, 0.88)
	panel_style.border_color = Color(0.61, 0.73, 0.52, 0.38)
	panel_style.set_border_width_all(1)
	panel_style.set_corner_radius_all(10)
	panel_style.content_margin_left = 4
	panel_style.content_margin_right = 4
	for panel_path in ["TopMargin/HBox/AtmospherePill", "TopResourceMargin/ResourcePill", "BottomLeftNav/Panel", "BottomCenterToolbar/Panel", "BottomQuickActions/Panel", "BottomRightTime/Panel", "ToastContainer/Panel"]:
		get_node(panel_path).add_theme_stylebox_override("panel", panel_style)
	var button_style := StyleBoxFlat.new()
	button_style.bg_color = Color(0.16, 0.22, 0.17, 0.94)
	button_style.set_corner_radius_all(6)
	button_style.set_content_margin_all(7)
	var hover_style := button_style.duplicate()
	hover_style.bg_color = Color(0.27, 0.38, 0.25, 1.0)
	for button in [btn_save, btn_mode, btn_terrain, btn_nav_canopy, btn_nav_surface, btn_nav_nest, btn_dig, btn_fill, btn_cancel, btn_pheromone, btn_honeys, btn_journal, btn_hive, btn_zoom_out, btn_zoom_in, btn_weather, btn_colony, btn_help, btn_pause, btn_1x, btn_2x, btn_5x]:
		button.add_theme_stylebox_override("normal", button_style)
		button.add_theme_stylebox_override("hover", hover_style)
		button.add_theme_color_override("font_color", Color(0.96, 0.95, 0.84))
		button.add_theme_color_override("font_hover_color", Color.WHITE)
	for label in [telemetry_label, biome_label, weather_label, clay_label, wax_label, honey_label, protein_label, seed_label, ant_label, bee_label]:
		label.add_theme_color_override("font_color", Color(0.97, 0.95, 0.86))

func _process(delta: float) -> void:
	if toast_timer > 0.0:
		toast_timer -= delta
		if toast_timer <= 0.0:
			toast_panel.visible = false

func _update_all_labels() -> void:
	_on_climate_updated()
	_on_weather_changed(GameManager.weather_state)
	_on_resources_updated()
	_on_mode_changed(GameManager.game_mode)
	_on_terrain_mode_changed(GameManager.use_tilemap_terrain)

func _on_terrain_mode_changed(use_tilemap: bool) -> void:
	if btn_terrain:
		btn_terrain.text = "🗺 Đất: Mới" if use_tilemap else "🗺 Đất: Cũ"


func _on_climate_updated() -> void:
	telemetry_label.text = "🌡 %.1f°C   💧 %.0f%%   CO₂ %.0f" % [
		GameManager.temperature,
		GameManager.humidity,
		GameManager.co2_level
	]
	biome_label.text = "🌾 " + GameManager.current_biome

func _on_weather_changed(new_weather: String) -> void:
	match new_weather:
		"SUNNY":
			weather_label.text = "☀️ Nắng Ấm"
			btn_weather.text = "☀ Thời tiết"
		"RAINSTORM":
			weather_label.text = "🌧️ Mưa Bão"
			btn_weather.text = "🌧 Mưa bão"
		"HEATWAVE":
			weather_label.text = "🔥 Nắng Gắt"
			btn_weather.text = "🔥 Nắng gắt"
		"WINTER_CHILL":
			weather_label.text = "❄️ Mùa Đông"
			btn_weather.text = "❄ Trời lạnh"

func _on_resources_updated() -> void:
	clay_label.text = "🧱 %d" % GameManager.clay_mud
	wax_label.text = "🕯️ %.1fg" % GameManager.beeswax
	honey_label.text = "🍯 %.1fg" % GameManager.get_total_honey()
	protein_label.text = "🦗 %.1fg" % GameManager.insect_protein
	seed_label.text = "🌾 %d" % GameManager.seeds_stock
	
	var total_ants = GameManager.queen_ant_count + GameManager.minor_nurse_ants + GameManager.media_forager_ants + GameManager.major_soldier_ants
	ant_label.text = "🐜 %d (%dL)" % [total_ants, GameManager.major_soldier_ants]
	
	var total_bees = GameManager.queen_bee_count + GameManager.nurse_bees + GameManager.builder_bees + GameManager.guard_fanner_bees + GameManager.forager_bees
	bee_label.text = "🐝 %d" % total_bees

	if honey_dialog.visible:
		_update_honey_dialog()

func _update_honey_dialog() -> void:
	honey_detail.text = "🌺 Wildflower Honey (Mật rừng dại): %.1fg\n🌳 Acacia Honey (Mật hoa keo): %.1fg\n🍀 Clover Honey (Mật cỏ ba lá): %.1fg\n🌸 Blossom Honey (Mật hoa mùa xuân): %.1fg\n\n🛡️ Cơ chế bảo tồn đàn: %s (Luôn giữ lại ít nhất 25g mật để bầy ong không bao giờ đói)" % [
		GameManager.honey_wildflower,
		GameManager.honey_acacia,
		GameManager.honey_clover,
		GameManager.honey_blossom,
		"BẬT" if GameManager.keep_honey_for_bees else "TẮT"
	]

func _on_mode_changed(mode: String) -> void:
	if mode == "LIVING":
		btn_mode.text = "🌱 Thảnh thơi"
	else:
		btn_mode.text = "⚔ Sinh tồn"

func _on_pheromone_priority_updated() -> void:
	_show_toast("Đã cập nhật Pheromone: %s Mode" % GameManager.priority_mode)

func _show_toast(msg: String) -> void:
	toast_label.text = msg
	toast_panel.visible = true
	toast_timer = 3.5

# --- TOOL ACTIONS ---

func _on_tool_dig_pressed() -> void:
	if GameManager.current_tool == "DIG":
		GameManager.set_tool("NONE")
	else:
		GameManager.set_tool("DIG")
	_update_tool_buttons()

func _on_tool_fill_pressed() -> void:
	if GameManager.current_tool == "FILL":
		GameManager.set_tool("NONE")
	else:
		GameManager.set_tool("FILL")
	_update_tool_buttons()

func _on_tool_cancel_pressed() -> void:
	if GameManager.current_tool == "DELETE":
		GameManager.set_tool("NONE")
	else:
		GameManager.set_tool("DELETE")
	_update_tool_buttons()

func _update_tool_buttons() -> void:
	btn_dig.text = "⛏ Đào ✓" if GameManager.current_tool == "DIG" else "⛏ Đào"
	btn_fill.text = "🧱 Lấp ✓" if GameManager.current_tool == "FILL" else "🧱 Lấp"
	btn_cancel.text = "✕ Hủy ✓" if GameManager.current_tool == "DELETE" else "✕ Hủy"

# --- NAVIGATION ---

func _on_nav_canopy_pressed() -> void:
	var cam = get_tree().root.find_child("Camera2D", true, false)
	if cam and cam.has_method("go_to_canopy"):
		cam.go_to_canopy()

func _on_nav_surface_pressed() -> void:
	var cam = get_tree().root.find_child("Camera2D", true, false)
	if cam and cam.has_method("go_to_outworld"):
		cam.go_to_outworld()

func _on_nav_nest_pressed() -> void:
	var cam = get_tree().root.find_child("Camera2D", true, false)
	if cam and cam.has_method("go_to_formicarium"):
		cam.go_to_formicarium()

func _on_btn_journal_pressed() -> void:
	var text = "[b][font_size=18]Biên Niên Sử Bể Vivarium Tự Nhiên[/font_size][/b]\n\n"
	for entry in StoryManager.get_unlocked_entries():
		text += "[color=#B8653A][b]" + entry["title"] + "[/b][/color] - [i]" + entry["date"] + "[/i]\n"
		text += entry["content"] + "\n\n"
	journal_content.text = text
	journal_dialog.popup_centered()

func _camera_action(method_name: String) -> void:
	var cam = get_tree().root.find_child("Camera2D", true, false)
	if cam and cam.has_method(method_name):
		cam.call(method_name)

func _cycle_weather() -> void:
	var states := ["SUNNY", "RAINSTORM", "HEATWAVE", "WINTER_CHILL"]
	var next_index := (states.find(GameManager.weather_state) + 1) % states.size()
	GameManager.set_weather(states[next_index])

func _show_colony_dialog() -> void:
	colony_dialog.dialog_text = "Kiến: %d y tá · %d thợ · %d lính · %d dọn tổ\nOng: %d y tá · %d xây tổ · %d canh gác · %d kiếm mật\n\nTrứng kiến: %d · Ấu trùng kiến: %d\nTrứng ong: %d · Ấu trùng ong: %d\n\nBùn đất: %d · Hạt: %d · Mật: %.1fg" % [GameManager.minor_nurse_ants, GameManager.media_forager_ants, GameManager.major_soldier_ants, GameManager.undertaker_ants, GameManager.nurse_bees, GameManager.builder_bees, GameManager.guard_fanner_bees, GameManager.forager_bees, GameManager.ant_eggs, GameManager.ant_larvae, GameManager.bee_eggs, GameManager.bee_larvae, GameManager.clay_mud, GameManager.seeds_stock, GameManager.get_total_honey()]
	colony_dialog.popup_centered()
