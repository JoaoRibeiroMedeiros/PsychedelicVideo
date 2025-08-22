import numpy as np
import matplotlib.pyplot as plt
from celluloid import Camera
import random
from scipy.ndimage import label

def create_grid(size, initial_population):
    grid = np.zeros((size, 2*size), dtype=int)  # Swapped dimensions for horizontal layout
    for _ in range(initial_population):
        x = random.randint(0, size - 1)         # Height
        y = random.randint(0, 2*size - 1)       # Width
        grid[x, y] = 1
    return grid

def update_grid(grid):
    height, width = grid.shape
    new_grid = np.copy(grid)
    for i in range(height):
        for j in range(width):
            live_neighbors = 0
            for x in range(-1, 2):
                for y in range(-1, 2):
                    if (x != 0 or y != 0) and \
                       (i + x >= 0 and i + x < height) and \
                       (j + y >= 0 and j + y < width):
                        live_neighbors += grid[i + x, j + y]

            if grid[i, j] == 1:
                if live_neighbors < 2 or live_neighbors > 3:
                    new_grid[i, j] = 0
            else:
                if live_neighbors == 3:
                    new_grid[i, j] = 1
    return new_grid

def get_cluster_colors(grid):
    # Label connected components
    labeled_array, num_features = label(grid)
    
    # Create a color map for the clusters with white background
    colors = np.ones((*grid.shape, 3))  # RGB colors, initialized to white
    
    # Calculate cluster sizes
    cluster_sizes = np.bincount(labeled_array.ravel())[1:]  # Skip background (0)
    
    # Assign colors based on cluster size
    for i in range(1, num_features + 1):
        mask = labeled_array == i
        size = cluster_sizes[i-1]
        
        # Use size to generate deterministic color
        # Normalize size to [0,1] range using a reasonable max size
        normalized_size = min(size / 100, 1.0)  # Cap at 100 cells for color scaling
        
        # Create a color based on size (using HSV color space for better visualization)
        # Blue (0.6) to Yellow (0.15) in HSV
        hue = 0.6 - (normalized_size * 0.45)  # Transition from blue to yellow
        saturation = 0.9  # Keep high saturation for vibrant colors
        value = 0.9  # Keep high value for bright colors
        
        # Convert HSV to RGB
        h = hue
        s = saturation
        v = value
        
        c = v * s
        x = c * (1 - abs((h * 6) % 2 - 1))
        m = v - c
        
        if h < 1/6:
            r, g, b = c, x, 0
        elif h < 2/6:
            r, g, b = x, c, 0
        elif h < 3/6:
            r, g, b = 0, c, x
        elif h < 4/6:
            r, g, b = 0, x, c
        elif h < 5/6:
            r, g, b = x, 0, c
        else:
            r, g, b = c, 0, x
            
        color = np.array([r + m, g + m, b + m])
        colors[mask] = color
    
    return colors

grid_size = 50
initial_population = 1000
num_generations = 100

grid = create_grid(grid_size, initial_population)

fig = plt.figure(figsize=(16, 8))
ax = fig.add_subplot(111)
ax.set_xticks([])
ax.set_yticks([])
camera = Camera(fig)

for _ in range(num_generations):
    # Get colored clusters
    colored_grid = get_cluster_colors(grid)
    ax.imshow(colored_grid)
    camera.snap()
    grid = update_grid(grid)

animation = camera.animate(interval=100)
# To save the animation, you might need to install ffmpeg
animation.save('game_of_life.gif', writer='imagemagick')
plt.show()
print("done")