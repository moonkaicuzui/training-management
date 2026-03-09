# Q-TRAIN Agent Team Reference (v3.0)

> 이 파일은 `/AGENTS.md`의 요약본입니다. 상세 정보는 루트 AGENTS.md를 참조하세요.

## 12명 에이전트 팀

| # | ID | 역할 | 담당 영역 |
|---|-----|------|----------|
| 1 | ARCH | Team Lead | 아키텍처, 작업 분해, 최종 검증 |
| 2 | DATA | 데이터 | Firebase, Firestore, 서비스, 타입, 보안규칙 |
| 3 | UI | 프론트엔드 | React 컴포넌트, 페이지, Shadcn, 반응형 |
| 4 | DOMAIN | 도메인 | AQL/5PRS/CAPA/검사/TQC/MD 비즈니스 로직 |
| 5 | STATE | 상태관리 | Zustand 스토어, 훅, 성능 최적화 |
| 6 | I18N | 국제화 | i18n (ko/en/vi), RBAC, 접근성 |
| 7 | TEST | QA | Vitest, Playwright, 빌드 검증 |
| 8 | EMAIL | 이메일 | Nodemailer SMTP, 메일 템플릿 |
| 9 | MANUAL | 매뉴얼 | 사용자 매뉴얼, 교육 가이드, 문서 |
| 10 | REPORT | 리포트 | PDF/PPTX/Excel, KPI, 대시보드 |
| 11 | DEVOPS | 배포 | Firebase 배포, Vite, PWA |
| 12 | SECURITY | 보안 | Firestore rules, Auth, XSS |

## 핵심 규칙
- 코드 변경: types → services → stores → components → pages
- i18n: 새 키 추가 시 ko/en/vi 3파일 동기화
- 이메일: EMAIL 에이전트 전담, Nodemailer SMTP만 사용
- 빌드 검증: `npm run typecheck && npm run build` 필수
