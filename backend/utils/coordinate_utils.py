from typing import Tuple


def percent_to_pixel_x(x_percent: float, image_width: int) -> int:
    """
    Convert a horizontal percentage value to a pixel coordinate.

    Args:
        x_percent:   Horizontal position as a percentage of the image width (0–100).
        image_width: Total width of the image in pixels.

    Returns:
        Pixel x-coordinate as an integer.
    """
    return int((x_percent / 100.0) * image_width)


def percent_to_pixel_y(y_percent: float, image_height: int) -> int:
    """
    Convert a vertical percentage value to a pixel coordinate.

    Args:
        y_percent:    Vertical position as a percentage of the image height (0–100).
        image_height: Total height of the image in pixels.

    Returns:
        Pixel y-coordinate as an integer.
    """
    return int((y_percent / 100.0) * image_height)


def calculate_text_position(
    x_percent: float,
    y_percent: float,
    image_width: int,
    image_height: int,
) -> Tuple[int, int]:
    """
    Convert percentage-based coordinates into absolute pixel coordinates.

    Certificate layouts use percentage coordinates so they remain
    resolution-independent across different template sizes.

    Args:
        x_percent:    Horizontal position as a percentage of the image width (0–100).
        y_percent:    Vertical position as a percentage of the image height (0–100).
        image_width:  Total width of the image in pixels.
        image_height: Total height of the image in pixels.

    Returns:
        A (x, y) tuple of integer pixel coordinates.
    """
    x = percent_to_pixel_x(x_percent, image_width)
    y = percent_to_pixel_y(y_percent, image_height)
    return x, y