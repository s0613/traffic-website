# 베이스 이미지로 Node.js 사용
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 파일 복사 및 설치
COPY package.json package-lock.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# 빌드 실행
RUN npm run build

# 포트 노출
EXPOSE 3000

# 앱 실행
CMD ["npm", "start"]
