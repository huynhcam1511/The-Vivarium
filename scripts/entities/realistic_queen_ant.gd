extends Node2D

# Realistic Queen Ant Controller
var breath_phase: float = 0.0

@onready var sprite: Sprite2D = $Sprite2D

func _ready() -> void:
	print("[Vivarium] Queen Ant established in the Royal Chamber.")

func _process(delta: float) -> void:
	# Subtle physogastric breathing animation (bụng phình nhịp thở sinh học)
	breath_phase += delta * 2.2
	var breath_scale = 1.0 + sin(breath_phase) * 0.035
	sprite.scale = Vector2(breath_scale, 1.0 + sin(breath_phase + 0.4) * 0.02)
