extends Node2D

# Realistic Queen Ant Controller
var breath_phase: float = 0.0

@onready var sprite: Sprite2D = $Sprite2D

func _ready() -> void:
	print("[Vivarium] Queen Ant established in the Royal Chamber.")

func _process(delta: float) -> void:
	# Quiet movement in the royal chamber; preserve the painted silhouette.
	breath_phase += delta * 2.2
	sprite.position.y = sin(breath_phase) * 0.7
	sprite.rotation = sin(breath_phase * 0.5) * 0.006
