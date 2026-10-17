extends Node2D

# Realistic Worker Ant Controller (Camponotus / Messor)
@export var speed: float = 45.0
@export var role: String = "forager" # "nurse", "forager", "builder"

var waypoints: Array[Vector2] = []
var current_target_index: int = 0
var leg_anim_phase: float = 0.0
var carrying_seed: bool = false

@onready var sprite: Sprite2D = $Sprite2D
@onready var seed_sprite: Sprite2D = $SeedSprite

func _ready() -> void:
	# Small random size variation for natural look
	var scale_var = randf_range(0.85, 1.15)
	scale = Vector2(scale_var, scale_var)
	
	if seed_sprite:
		seed_sprite.visible = carrying_seed

func _process(delta: float) -> void:
	if waypoints.size() == 0:
		return
		
	var target = waypoints[current_target_index]
	var dir = (target - position)
	var dist = dir.length()
	
	if dist < 8.0:
		# Arrived at waypoint, pick next
		current_target_index = (current_target_index + 1) % waypoints.size()
		if randf() > 0.6:
			carrying_seed = !carrying_seed
			if seed_sprite:
				seed_sprite.visible = carrying_seed
	else:
		dir = dir.normalized()
		position += dir * speed * delta
		
		# Rotate towards movement direction smoothly
		var target_angle = dir.angle() + PI / 2.0
		rotation = lerp_angle(rotation, target_angle, 8.0 * delta)
		
		# Subtle walking wiggle / leg phase
		leg_anim_phase += delta * 12.0
		sprite.scale.x = 1.0 + sin(leg_anim_phase) * 0.06
