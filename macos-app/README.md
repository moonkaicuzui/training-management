# Q-TRAIN macOS Application

HWK Vietnam QIP 교육 관리 시스템 맥북 런처 앱입니다.

## 설치 방법

### 자동 설치
```bash
cp -R Q-TRAIN.app /Applications/
```

### 수동 설치
1. `Q-TRAIN.app` 폴더를 `/Applications/` 폴더로 드래그
2. Launchpad에서 Q-TRAIN 아이콘 확인

## 아이콘 새로고침

아이콘이 바로 나타나지 않으면:
```bash
# Launch Services 캐시 초기화
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user

# Dock 및 Launchpad 재시작
defaults write com.apple.dock ResetLaunchPad -bool true && killall Dock
```

## 앱 구조

```
Q-TRAIN.app/
├── Contents/
│   ├── Info.plist          # 앱 메타데이터
│   ├── MacOS/
│   │   └── Q-TRAIN         # 실행 스크립트
│   └── Resources/
│       └── AppIcon.icns    # 앱 아이콘
```

## 연결 URL

앱 클릭 시 다음 URL로 브라우저가 열립니다:
- https://moonkaicuzui.github.io/training-management/

## 아이콘 수정

1. `icon.svg` 파일 수정
2. 아이콘 재생성:
```bash
# SVG to PNG
qlmanage -t -s 1024 -o . icon.svg

# Create iconset
mkdir -p AppIcon.iconset
sips -z 16 16 icon.svg.png --out AppIcon.iconset/icon_16x16.png
sips -z 32 32 icon.svg.png --out AppIcon.iconset/icon_16x16@2x.png
sips -z 32 32 icon.svg.png --out AppIcon.iconset/icon_32x32.png
sips -z 64 64 icon.svg.png --out AppIcon.iconset/icon_32x32@2x.png
sips -z 128 128 icon.svg.png --out AppIcon.iconset/icon_128x128.png
sips -z 256 256 icon.svg.png --out AppIcon.iconset/icon_128x128@2x.png
sips -z 256 256 icon.svg.png --out AppIcon.iconset/icon_256x256.png
sips -z 512 512 icon.svg.png --out AppIcon.iconset/icon_256x256@2x.png
sips -z 512 512 icon.svg.png --out AppIcon.iconset/icon_512x512.png
sips -z 1024 1024 icon.svg.png --out AppIcon.iconset/icon_512x512@2x.png

# Convert to icns
iconutil -c icns AppIcon.iconset -o Q-TRAIN.app/Contents/Resources/AppIcon.icns

# Cleanup
rm -f icon.svg.png && rm -rf AppIcon.iconset
```

---

© 2024 HWK Vietnam. All rights reserved.
