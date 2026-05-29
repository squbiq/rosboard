source ../install/setup.sh
pkill rosboard_node
colcon build
ros2 run rosboard rosboard_node
