curl -s -w "
HTTP %{http_code}
" http://localhost:3000/memos

curl -s -w "
HTTP %{http_code}
" -X POST http://localhost:3000/memos   -H "Content-Type: application/json"   -d '{"title":"4주차 점검","content":"프론트 연결 전 생성 확인"}'

# 위 POST 응답의 data.id를 아래 <방금_생성된_id> 자리에 넣어 확인합니다.
curl -s -w "
HTTP %{http_code}
" http://localhost:3000/memos/<방금_생성된_id>

curl -s -w "
HTTP %{http_code}
" -X PUT http://localhost:3000/memos/<방금_생성된_id>   -H "Content-Type: application/json"   -d '{"title":"수정된 제목","content":"수정된 내용","pinned":true,"image_url":null}'

curl -s -w "
HTTP %{http_code}
" -X DELETE http://localhost:3000/memos/<방금_생성된_id>
