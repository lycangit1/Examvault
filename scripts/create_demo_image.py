import os
from PIL import Image, ImageDraw, ImageFont

def create_leaked_screenshot():
    # Dimensions
    width = 900
    height = 550

    # Background
    img = Image.new("RGBA", (width, height), (10, 17, 40, 255))
    draw = ImageDraw.Draw(img)

    # Card background
    card_margin = 30
    draw.rounded_rectangle(
        [(card_margin, card_margin), (width - card_margin, height - card_margin)],
        radius=20,
        fill=(15, 23, 42, 255),
        outline=(30, 41, 59, 255),
        width=2
    )

    # Header bar
    draw.rounded_rectangle(
        [(card_margin, card_margin), (width - card_margin, card_margin + 60)],
        radius=20,
        fill=(11, 19, 43, 255)
    )

    # Header Text
    draw.text((card_margin + 20, card_margin + 18), "ExamVault Secure Inspection Panel — PHY-2026-SET-A", fill=(14, 165, 233, 255))
    draw.text((width - card_margin - 180, card_margin + 18), "SESSION: EV-1042", fill=(168, 85, 247, 255))

    # Question Header
    draw.text((card_margin + 30, card_margin + 80), "QUESTION ID: Q-101", fill=(14, 165, 233, 255))
    draw.text((card_margin + 200, card_margin + 80), "Subject: Physics • Kinematics", fill=(148, 163, 184, 255))

    # Question Body
    q_text = "A car increases its velocity from 10 m/s to 30 m/s in 5 seconds.\nWhat is its acceleration?"
    draw.text((card_margin + 30, card_margin + 120), q_text, fill=(248, 250, 252, 255), spacing=8)

    # Options
    options = [
        "A.  2 m/s²",
        "B.  4 m/s²",
        "C.  6 m/s²",
        "D.  8 m/s²"
    ]
    opt_y = card_margin + 200
    for opt in options:
        draw.rounded_rectangle(
            [(card_margin + 30, opt_y), (width - card_margin - 30, opt_y + 40)],
            radius=10,
            fill=(2, 6, 23, 200),
            outline=(30, 41, 59, 255),
            width=1
        )
        draw.text((card_margin + 50, opt_y + 12), opt, fill=(226, 232, 240, 255))
        opt_y += 50

    # Diagonal Repeated Watermark Overlay
    watermark_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    wm_draw = ImageDraw.Draw(watermark_layer)
    wm_text = "CONFIDENTIAL - Reviewer_B - EV-1042 - 02:14"

    # Draw diagonal repeating pattern
    for y_offset in range(-200, height + 300, 100):
        for x_offset in range(-200, width + 400, 320):
            # Create a rotated text stamp
            stamp = Image.new("RGBA", (450, 60), (0, 0, 0, 0))
            s_draw = ImageDraw.Draw(stamp)
            s_draw.text((10, 15), wm_text, fill=(255, 255, 255, 38))
            rotated_stamp = stamp.rotate(25, expand=True, resample=Image.BICUBIC)
            watermark_layer.paste(rotated_stamp, (x_offset, y_offset), rotated_stamp)

    # Merge watermark on top
    final_img = Image.alpha_composite(img, watermark_layer)

    # Save to demo-assets and frontend/public/demo-assets
    os.makedirs("demo-assets", exist_ok=True)
    os.makedirs("frontend/public/demo-assets", exist_ok=True)

    final_img.save("demo-assets/leaked_question_q101.png", "PNG")
    final_img.save("frontend/public/demo-assets/leaked_question_q101.png", "PNG")
    print("Demo asset created: demo-assets/leaked_question_q101.png")

if __name__ == "__main__":
    create_leaked_screenshot()
