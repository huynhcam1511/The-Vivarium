extends Node2D

const FLIGHT_A: Texture2D = preload("res://assets/sprites/bee_flight_a.png")
const FLIGHT_B: Texture2D = preload("res://assets/sprites/bee_flight_b.png")

# Realistic Honeybee Controller (Apis mellifera)
@export var home_pos: Vector2 = Vector2(1510, 655)
@export var flower_targets: Array[Vector2] = [
	Vector2(380, 660),
	Vector2(460, 680),
	Vector2(540, 670),
	Vector2(640, 690),
	Vector2(720, 660),
	Vector2(1180, 660),
	Vector2(1260, 680),
	Vector2(1340, 670),
	Vector2(1440, 690),
	Vector2(1540, 660),
	Vector2(2040, 680),
	Vector2(2160, 660),
	Vector2(2300, 690)
]

const BASE_BEE_SCALE: Vector2 = Vector2(0.027, 0.027)

var target_pos: Vector2 = Vector2(1180, 660)
var flight_speed: float = 105.0
var hover_phase: float = 0.0
var state: String = "flying" # "flying", "foraging"
var state_timer: float = 0.0

@onready var sprite: Sprite2D = $Sprite2D

func _ready() -> void:
	hover_phase = randf() * TAU
	target_pos = flower_targets[randi() % flower_targets.size()]
	sprite.texture = FLIGHT_A
	sprite.scale = BASE_BEE_SCALE

func _process(delta: float) -> void:
	hover_phase += delta * TAU * 11.0
	state_timer += delta
	
	if state == "flying":
		var to_target = (target_pos - position)
		var dist = to_target.length()
		if dist < 18.0:
			if target_pos.distance_to(home_pos) < 18.0:
				target_pos = flower_targets[randi() % flower_targets.size()]
			else:
				state = "foraging"
				state_timer = 0.0
		else:
			var dir = to_target.normalized()
			position += dir * flight_speed * delta
			if absf(dir.x) > 0.08:
				sprite.flip_h = dir.x > 0.0
			rotation = lerpf(rotation, clampf(dir.y * 0.15, -0.15, 0.15), 6.0 * delta)
			
	elif state == "foraging":
		# Hold over a flower while collecting nectar; visual bob does not drift position.
		if state_timer > 2.2:
			# Pick new flower or return to hive
			if randf() > 0.35:
				target_pos = flower_targets[randi() % flower_targets.size()]
			else:
				target_pos = home_pos
			state = "flying"
			state_timer = 0.0
			
	# Two distinct wing poses; the body keeps its shape and scale.
	sprite.texture = FLIGHT_A if sin(hover_phase) >= 0.0 else FLIGHT_B
	sprite.position.y = sin(hover_phase * 0.18) * 2.0


