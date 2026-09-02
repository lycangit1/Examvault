import os
import zlib
import struct

def create_png(width, height, rgb_buffer):
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack("!2I5B", width, height, 8, 2, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff
    png += struct.pack("!I", len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack("!I", ihdr_crc)
    
    # Raw scanlines with filter byte 0 (None)
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # filter byte
        row_start = y * width * 3
        raw_data.extend(rgb_buffer[row_start : row_start + width * 3])
        
    # IDAT chunk
    compressed = zlib.compress(bytes(raw_data), 9)
    idat_crc = zlib.crc32(b'IDAT' + compressed) & 0xffffffff
    png += struct.pack("!I", len(compressed)) + b'IDAT' + compressed + struct.pack("!I", idat_crc)
    
    # IEND chunk
    iend_crc = zlib.crc32(b'IEND') & 0xffffffff
    png += struct.pack("!I", 0) + b'IEND' + struct.pack("!I", iend_crc)
    return png

def generate_leaked_image():
    width = 800
    height = 500
    pixels = bytearray(width * height * 3)

    # Fill dark slate background (#0A1128)
    for i in range(0, len(pixels), 3):
        pixels[i] = 10     # R
        pixels[i+1] = 17   # G
        pixels[i+2] = 40   # B

    # Draw card rectangle (#0F172A)
    for y in range(30, height - 30):
        for x in range(30, width - 30):
            idx = (y * width + x) * 3
            # Card body
            pixels[idx] = 15
            pixels[idx+1] = 23
            pixels[idx+2] = 42

    # Draw top header bar (#001F54)
    for y in range(30, 90):
        for x in range(30, width - 30):
            idx = (y * width + x) * 3
            pixels[idx] = 0
            pixels[idx+1] = 31
            pixels[idx+2] = 84

    # Draw simulated option rows (#034078)
    for row in range(4):
        start_y = 220 + row * 55
        for y in range(start_y, start_y + 40):
            for x in range(50, width - 50):
                idx = (y * width + x) * 3
                pixels[idx] = 3
                pixels[idx+1] = 64
                pixels[idx+2] = 120

    # Draw watermark stripes across image
    for y in range(height):
        for x in range(width):
            # Diagonal bands (slope approx 1)
            if (x + y * 2) % 180 < 12:
                idx = (y * width + x) * 3
                # Blend with white/cyan watermark highlight
                pixels[idx] = min(255, pixels[idx] + 60)
                pixels[idx+1] = min(255, pixels[idx+1] + 80)
                pixels[idx+2] = min(255, pixels[idx+2] + 90)

    png_bytes = create_png(width, height, pixels)

    os.makedirs("demo-assets", exist_ok=True)
    os.makedirs("frontend/public/demo-assets", exist_ok=True)

    with open("demo-assets/leaked_question_q101.png", "wb") as f:
        f.write(png_bytes)

    with open("frontend/public/demo-assets/leaked_question_q101.png", "wb") as f:
        f.write(png_bytes)

    print("Created pure PNG demo asset at demo-assets/leaked_question_q101.png")

if __name__ == "__main__":
    generate_leaked_image()
