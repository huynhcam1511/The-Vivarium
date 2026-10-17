extends Node2D

# Realistic Honeybee Controller (Apis mellifera)
@export var home_pos: Vector2 = Vector2(280, 420)
@export var flower_targets: Array[Vector2] = [
	Vector2(442, 665),
	Vector2(490, 680),
	Vector2(585, 670),
	Vector2(630, 655)
]

var target_pos: Vector2 = Vector2(442, 665)
var flight_speed: float = 65.0
var hover_phase: float = 0.0
var state: String = "hovering" # "flying", "foraging", "returning"
var state_timer: float = 0.0

@onready var sprite: Sprite2D = $Sprite2D

func _ready() -> void:
	hover_phase = randf() * TAU
	target_pos = flower_targets[randi() % flower_targets.size()]
	position = target_pos + Vector2(randf_range(-40, 40), randf_range(-40, -10))

func _process(delta: float) -> void:
	hover_phase += delta * 18.0
	state_timer += delta
	
	if state == "flying":
		var to_target = (target_pos - position)
		var dist = to_target.length()
		if dist < 12.0:
			state = "foraging"
			state_timer = 0.0
		else:
			var dir = to_target.normalized()
			position += dir * flight_speed * delta
			# Lean slightly into turn
			rotation = lerp_angle(rotation, dir.angle() + PI / 2.0, 6.0 * delta)
			
	elif state == "foraging":
		# Hovering gently above flower, collecting nectar/pollen
		position.y += sin(hover_phase) * 0.4
		if state_timer > 3.0:
			# Pick new flower or return to hive
			if randf() > 0.4:
				target_pos = flower_targets[randi() % flower_targets.size()]
			else:
				target_pos = home_pos
			state = "flying"
			state_timer = 0.0
			
	# High-frequency wing buzz animation (subtle squish)
	sprite.scale.x = 1.0 + sin(hover_phase * 2.0) * 0.08
