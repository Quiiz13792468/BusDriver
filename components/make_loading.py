from PIL import Image, ImageDraw
import os
import math

# === 설정 ===
GIF_SIZE = (50, 50)
BG_COLOR = (0, 0, 0, 0)  # 완전 투명 배경
BUS_COLOR = (255, 220, 0)  # 노란색
WINDOW_COLOR = (100, 200, 255) # 하늘색 창문
TIRE_COLOR = (30, 30, 30)    # 진한 회색 타이어
SMOKE_COLOR = (200, 200, 200, 180) # 반투명 회색 연기
OUTPUT_FILENAME = os.path.join(
    os.path.dirname(__file__),
    "..",
    "public",
    "assets",
    "schoolbus_loading.gif"
)

# === 버스 그리기 함수 (단순화된 픽셀 아트 스타일) ===
def draw_bus_frame(draw, frame_idx):
    # 프레임에 따른 버스 높이 (들썩거림 표현)
    bounce = int(round(math.sin(2 * math.pi * frame_idx / 12)))

    # 버스 기본 위치 기준점 (중앙 약간 오른쪽)
    base_x = 12
    base_y = 20 + bounce

    # -- 연기 그리기 (버스보다 뒤에 있어야 하므로 먼저 그림) --
    # 한 번에 하나씩 나오는 둥근 연무
    smoke_phase = frame_idx % 12
    sx = base_x - 3 - smoke_phase * 2
    sy = base_y + 10 - (smoke_phase // 4)
    radius = 3
    draw.ellipse([sx - radius, sy - radius, sx + radius, sy + radius], fill=SMOKE_COLOR)

    # -- 버스 차체 그리기 --
    # 메인 바디
    draw.rectangle([base_x, base_y, base_x + 30, base_y + 15], fill=BUS_COLOR)
    # 앞부분 (엔진룸) 약간 낮게
    draw.rectangle([base_x + 30, base_y + 3, base_x + 35, base_y + 15], fill=BUS_COLOR)

    # -- 창문 그리기 --
    draw.rectangle([base_x + 2, base_y + 2, base_x + 8, base_y + 7], fill=WINDOW_COLOR)
    draw.rectangle([base_x + 10, base_y + 2, base_x + 16, base_y + 7], fill=WINDOW_COLOR)
    draw.rectangle([base_x + 18, base_y + 2, base_x + 24, base_y + 7], fill=WINDOW_COLOR)
    
    # -- 바퀴 그리기 --
    # 뒷바퀴
    draw.ellipse([base_x + 3, base_y + 12, base_x + 10, base_y + 19], fill=TIRE_COLOR)
    # 앞바퀴
    draw.ellipse([base_x + 23, base_y + 12, base_x + 30, base_y + 19], fill=TIRE_COLOR)
    
    # -- 배기구 (작은 점) --
    draw.rectangle([base_x - 2, base_y + 12, base_x - 1, base_y + 13], fill=(50,50,50))


# === 메인 GIF 생성 로직 ===
frames = []
# 48개의 프레임을 반복해서 애니메이션 생성
for i in range(48):
    # 새 투명 이미지 생성
    img = Image.new("RGBA", GIF_SIZE, BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    # 버스와 연기 그리기
    draw_bus_frame(draw, i)
    
    # 결과 리스트에 추가
    frames.append(img)

# === GIF 파일로 저장 ===
# duration: 각 프레임 지속 시간(ms), loop=0: 무한 반복, disposal=2: 이전 프레임 지우고 그리기(투명 배경시 필수)
frames[0].save(
    OUTPUT_FILENAME,
    save_all=True,
    append_images=frames[1:],
    optimize=False,
    duration=80,
    loop=0,
    disposal=2 
)

print(f"성공적으로 {OUTPUT_FILENAME} 파일이 생성되었습니다.")
print(f"파일 위치: {os.path.abspath(OUTPUT_FILENAME)}")
