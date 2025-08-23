import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation, PillowWriter
import numpy as np


class PsychedelicAnimator:
    """Universal animator for all psychedelic animations."""
    
    def __init__(self, width: int = 800, height: int = 600):
        """
        Initialize animator.
        
        Args:
            width: Animation width in pixels
            height: Animation height in pixels
        """
        self.width = width
        self.height = height
        self.fig = None
        self.ax = None
    
    def setup_plot(self, figsize=None):
        """Setup matplotlib figure and axis."""
        if figsize is None:
            figsize = (self.width/100, self.height/100)
        
        self.fig, self.ax = plt.subplots(figsize=figsize)
        self.ax.set_xlim(0, self.width)
        self.ax.set_ylim(0, self.height)
        self.ax.set_aspect('equal')
        self.ax.axis('off')
        self.ax.set_facecolor('black')
    
    def create_simple_animation(self, animation_func, num_frames: int = 200, interval: int = 50):
        """
        Create matplotlib animation from a function.
        
        Args:
            animation_func: Function that takes frame number and returns image data
            num_frames: Number of frames to generate
            interval: Time between frames in milliseconds
            
        Returns:
            FuncAnimation object
        """
        if self.fig is None:
            self.setup_plot()
        
        # Initial empty plot
        im = self.ax.imshow(np.zeros((self.height, self.width, 3)), 
                           extent=[0, self.width, 0, self.height])
        
        def animate(frame):
            """Animation function for matplotlib."""
            frame_data = animation_func(frame)
            im.set_array(frame_data)
            return [im]
        
        return FuncAnimation(self.fig, animate, frames=num_frames, 
                           interval=interval, blit=True, repeat=True)
    
    def save_gif(self, animation_func, filename: str, num_frames: int = 200, interval: int = 50, fps: int = 20):
        """
        Save animation as GIF file.
        
        Args:
            animation_func: Function that generates frames
            filename: Output filename (should end with .gif)
            num_frames: Number of frames to generate
            interval: Time between frames in milliseconds
            fps: Frames per second for the GIF
        """
        animation = self.create_simple_animation(animation_func, num_frames, interval)
        writer = PillowWriter(fps=fps)
        animation.save(filename, writer=writer)
        print(f"Animation saved as {filename}")
        return animation
    
    def save_frames(self, animation_func, output_dir: str, num_frames: int = 200, prefix: str = "frame"):
        """
        Save individual frames as PNG files.
        
        Args:
            animation_func: Function that generates frames
            output_dir: Directory to save frames
            num_frames: Number of frames to generate
            prefix: Filename prefix for frames
        """
        import os
        os.makedirs(output_dir, exist_ok=True)
        
        for i in range(num_frames):
            frame_data = animation_func(i)
            filename = os.path.join(output_dir, f"{prefix}_{i:04d}.png")
            plt.imsave(filename, frame_data)
        
        print(f"Saved {num_frames} frames to {output_dir}")
    
    def show(self, animation_func, num_frames: int = 200, interval: int = 50):
        """
        Display animation in matplotlib window.
        
        Args:
            animation_func: Function that generates frames
            num_frames: Number of frames to generate
            interval: Time between frames in milliseconds
        """
        animation = self.create_simple_animation(animation_func, num_frames, interval)
        plt.show()
        return animation


class GameOfLifeAnimator:
    """Legacy compatibility class for Game of Life animations."""
    
    def __init__(self, game_of_life, figsize=(16, 8)):
        """
        Initialize animator.
        
        Args:
            game_of_life: GameOfLife instance
            figsize: Figure size tuple
        """
        self.game = game_of_life
        self.fig = plt.figure(figsize=figsize)
        self.ax = self.fig.add_subplot(111)
        self.ax.set_xticks([])
        self.ax.set_yticks([])
    
    def save_animation(self, filename, num_generations=100, interval=100, fps=10):
        """
        Create and save animation to file.
        
        Args:
            filename: Output filename
            num_generations: Number of generations to animate
            interval: Time between frames in milliseconds
            fps: Frames per second
        """
        frames = []
        
        for _ in range(num_generations):
            # Get colored clusters
            colored_grid = self.game.get_cluster_colors()
            frames.append(colored_grid)
            self.game.update()
        
        # Create animation
        def animate(frame):
            self.ax.clear()
            self.ax.imshow(frames[frame])
            self.ax.set_xticks([])
            self.ax.set_yticks([])
        
        animation = FuncAnimation(self.fig, animate, frames=len(frames), 
                                 interval=interval, repeat=True)
        
        if filename.endswith('.gif'):
            writer = PillowWriter(fps=fps)
            animation.save(filename, writer=writer)
        
        return animation
    
    def show(self, num_generations=100, interval=100):
        """
        Create and display animation.
        
        Args:
            num_generations: Number of generations to animate
            interval: Time between frames in milliseconds
        """
        frames = []
        
        for _ in range(num_generations):
            colored_grid = self.game.get_cluster_colors()
            frames.append(colored_grid)
            self.game.update()
        
        def animate(frame):
            self.ax.clear()
            self.ax.imshow(frames[frame])
            self.ax.set_xticks([])
            self.ax.set_yticks([])
        
        animation = FuncAnimation(self.fig, animate, frames=len(frames), 
                                 interval=interval, repeat=True)
        plt.show()
        return animation
