extends Node2D

# The Vivarium - Swarm AI Stress Test & Benchmark Controller
# Kiểm thử khả năng vận hành 1.000 - 5.000 cá thể (Kiến & Ong) ở 60 FPS

@export var initial_entity_count: int = 1000
const MAX_ENTITIES: int = 5000

var ant_positions: PackedVector2Array = PackedVector2Array()
var ant_velocities: PackedVector2Array = PackedVector2Array()
var ant_targets: PackedVector2Array = PackedVector2Array()
var ant_states: PackedByteArray = PackedByteArray()

var bee_positions: PackedVector2Array = PackedVector2Array()
var bee_velocities: PackedVector2Array = PackedVector2Array()
var bee_phases: PackedFloat32Array = PackedFloat32Array()

var multimesh_ants: MultiMesh = null
var multimesh_instance_ants: MultiMeshInstance2D = null

var multimesh_bees: MultiMesh = null
var multimesh_instance_bees: MultiMeshInstance2D = null

var ant_count: int = 0
var bee_count: int = 0

var nest_waypoints: Array[Vector2] = [
	Vector2(540, 1120),
	Vector2(320, 1140),
	Vector2(190, 1380),
	Vector2(890, 1380),
	Vector2(540, 880),
	Vector2(460, 780),
	Vector2(620, 760)
]

func _init() -> void:
	_setup_multimeshes()

func _ready() -> void:
	set_swarm_size(initial_entity_count)
	print("[Swarm Benchmark] Ready. Target: %d entities." % initial_entity_count)

func _setup_multimeshes() -> void:
	if multimesh_ants != null:
		return
		
	# 1. MultiMesh cho Đàn Kiến
	multimesh_ants = MultiMesh.new()
	multimesh_ants.transform_format = MultiMesh.TRANSFORM_2D
	multimesh_ants.use_colors = true
	multimesh_ants.instance_count = MAX_ENTITIES
	
	var quad_mesh_ant = QuadMesh.new()
	quad_mesh_ant.size = Vector2(8, 4)
	multimesh_ants.mesh = quad_mesh_ant
	
	multimesh_instance_ants = MultiMeshInstance2D.new()
	multimesh_instance_ants.multimesh = multimesh_ants
	multimesh_instance_ants.z_index = 5
	add_child(multimesh_instance_ants)
	
	# 2. MultiMesh cho Đàn Ong
	multimesh_bees = MultiMesh.new()
	multimesh_bees.transform_format = MultiMesh.TRANSFORM_2D
	multimesh_bees.use_colors = true
	multimesh_bees.instance_count = MAX_ENTITIES
	
	var quad_mesh_bee = QuadMesh.new()
	quad_mesh_bee.size = Vector2(9, 6)
	multimesh_bees.mesh = quad_mesh_bee
	
	multimesh_instance_bees = MultiMeshInstance2D.new()
	multimesh_instance_bees.multimesh = multimesh_bees
	multimesh_instance_bees.z_index = 6
	add_child(multimesh_instance_bees)

func set_swarm_size(target_total: int) -> void:
	_setup_multimeshes()
	
	target_total = clampi(target_total, 100, MAX_ENTITIES)
	ant_count = int(target_total * 0.65) # 65% kiến
	bee_count = target_total - ant_count # 35% ong
	
	# Khởi tạo kiến
	ant_positions.resize(ant_count)
	ant_velocities.resize(ant_count)
	ant_targets.resize(ant_count)
	ant_states.resize(ant_count)
	
	for i in range(ant_count):
		var spawn_wp = nest_waypoints[randi() % nest_waypoints.size()]
		ant_positions[i] = spawn_wp + Vector2(randf_range(-60, 60), randf_range(-40, 40))
		ant_velocities[i] = Vector2.ZERO
		ant_targets[i] = nest_waypoints[randi() % nest_waypoints.size()]
		ant_states[i] = randi() % 3
		
		var xform = Transform2D(0.0, ant_positions[i])
		multimesh_ants.set_instance_transform_2d(i, xform)
		multimesh_ants.set_instance_color(i, Color(0.18, 0.12, 0.08))
		
	# Ẩn các instance thừa
	for i in range(ant_count, MAX_ENTITIES):
		multimesh_ants.set_instance_transform_2d(i, Transform2D(0.0, Vector2(-1000, -1000)))
		
	# Khởi tạo ong
	bee_positions.resize(bee_count)
	bee_velocities.resize(bee_count)
	bee_phases.resize(bee_count)
	
	for i in range(bee_count):
		bee_positions[i] = Vector2(randf_range(200, 900), randf_range(350, 750))
		bee_velocities[i] = Vector2(randf_range(-40, 40), randf_range(-25, 25))
		bee_phases[i] = randf_range(0.0, TAU)
		
		var xform = Transform2D(0.0, bee_positions[i])
		multimesh_bees.set_instance_transform_2d(i, xform)
		multimesh_bees.set_instance_color(i, Color(0.95, 0.72, 0.15))
		
	for i in range(bee_count, MAX_ENTITIES):
		multimesh_bees.set_instance_transform_2d(i, Transform2D(0.0, Vector2(-1000, -1000)))

func _process(delta: float) -> void:
	_update_ants_simulation(delta)
	_update_bees_simulation(delta)

func _update_ants_simulation(delta: float) -> void:
	if ant_count == 0 or multimesh_ants == null:
		return
	var speed: float = 45.0
	for i in range(ant_count):
		var pos = ant_positions[i]
		var target = ant_targets[i]
		var diff = target - pos
		var dist_sq = diff.length_squared()
		
		if dist_sq < 256.0:
			ant_targets[i] = nest_waypoints[randi() % nest_waypoints.size()]
		else:
			var dir = diff.normalized()
			pos += dir * speed * delta
			ant_positions[i] = pos
			
			var angle = dir.angle()
			var xform = Transform2D(angle, pos)
			multimesh_ants.set_instance_transform_2d(i, xform)

func _update_bees_simulation(delta: float) -> void:
	if bee_count == 0 or multimesh_bees == null:
		return
	for i in range(bee_count):
		var pos = bee_positions[i]
		bee_phases[i] += delta * 6.0
		
		var vel = bee_velocities[i]
		vel.y += sin(bee_phases[i]) * 15.0 * delta
		vel.x += cos(bee_phases[i] * 0.5) * 10.0 * delta
		
		pos += vel * delta
		
		if pos.x < 150.0: vel.x = abs(vel.x)
		elif pos.x > 930.0: vel.x = -abs(vel.x)
		if pos.y < 350.0: vel.y = abs(vel.y)
		elif pos.y > 780.0: vel.y = -abs(vel.y)
		
		bee_positions[i] = pos
		bee_velocities[i] = vel
		
		var angle = vel.angle()
		var xform = Transform2D(angle, pos)
		multimesh_bees.set_instance_transform_2d(i, xform)
