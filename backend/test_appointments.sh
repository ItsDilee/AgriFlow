#!/usr/bin/env bash
set -e

BASE="http://localhost:5000"
parse() { node -e "const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>{const p=JSON.parse(d.join(''));$1})"; }

ADMIN=$(curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@agriflow.com","password":"Password123"}' | parse "process.stdout.write(p.token)")
FARMER1=$(curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"ramesh@farm.com","password":"Password123"}' | parse "process.stdout.write(p.token)")
FARMER2=$(curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"suresh@farm.com","password":"Password123"}' | parse "process.stdout.write(p.token)")

CENTREID=$(curl -s $BASE/api/centres -H "Authorization: Bearer $ADMIN" | parse "const c=p.centres.find(x=>x.name.includes('Pune'));process.stdout.write(c._id)")
TOMORROW=$(node -e "const d=new Date();d.setDate(d.getDate()+3);process.stdout.write(d.toISOString().split('T')[0])")

echo "=== TEST 1: Available Slots ==="
curl -s "$BASE/api/appointments/slots?centreId=$CENTREID&date=$TOMORROW" -H "Authorization: Bearer $FARMER1" | \
  parse "console.log('Total slots:',p.slots.length); p.slots.slice(0,3).forEach(s=>console.log(' ',s.timeSlot,'max:',s.maxCapacity,'booked:',s.bookedCount))"

echo ""
echo "=== TEST 2: Book appointment (farmer 1) ==="
RESP1=$(curl -s -X POST $BASE/api/appointments -H "Content-Type: application/json" -H "Authorization: Bearer $FARMER1" \
  -d "{\"centreId\":\"$CENTREID\",\"date\":\"$TOMORROW\",\"timeSlot\":\"08:00-08:30\",\"commodity\":\"Wheat\",\"estimatedQuantity\":450}")
echo "$RESP1" | parse "if(p.appointment) console.log('Booked! Token:',p.appointment.tokenNumber,'Status:',p.appointment.status); else console.log('Error:',p.message)"
APPT1ID=$(echo "$RESP1" | parse "process.stdout.write(p.appointment?._id||'')")

echo ""
echo "=== TEST 3: Capacity reduced after booking ==="
curl -s "$BASE/api/appointments/slots?centreId=$CENTREID&date=$TOMORROW" -H "Authorization: Bearer $FARMER1" | \
  parse "const s=p.slots.find(x=>x.timeSlot==='08:00-08:30'); console.log('08:00-08:30 booked:',s.bookedCount,'remaining:',s.remainingCapacity)"

echo ""
echo "=== TEST 4: Farmer 2 books same slot ==="
curl -s -X POST $BASE/api/appointments -H "Content-Type: application/json" -H "Authorization: Bearer $FARMER2" \
  -d "{\"centreId\":\"$CENTREID\",\"date\":\"$TOMORROW\",\"timeSlot\":\"08:00-08:30\",\"commodity\":\"Soyabean\",\"estimatedQuantity\":200}" | \
  parse "if(p.appointment) console.log('Booked! Token:',p.appointment.tokenNumber); else console.log('Result:',p.message)"

echo ""
echo "=== TEST 5: Admin cannot book (403) ==="
curl -s -X POST $BASE/api/appointments -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN" \
  -d "{\"centreId\":\"$CENTREID\",\"date\":\"$TOMORROW\",\"timeSlot\":\"09:00-09:30\",\"commodity\":\"Wheat\",\"estimatedQuantity\":100}" | \
  parse "console.log('Response:',p.message)"

echo ""
echo "=== TEST 6: View my appointments ==="
curl -s $BASE/api/appointments/my -H "Authorization: Bearer $FARMER1" | \
  parse "console.log('Count:',p.appointments.length); p.appointments.slice(0,3).forEach(a=>console.log(' Token:',a.tokenNumber,'Status:',a.status,'Centre:',a.centre?.name))"

echo ""
echo "=== TEST 7: Reschedule appointment ==="
curl -s -X PATCH "$BASE/api/appointments/$APPT1ID/reschedule" -H "Content-Type: application/json" -H "Authorization: Bearer $FARMER1" \
  -d "{\"newDate\":\"$TOMORROW\",\"newTimeSlot\":\"09:00-09:30\"}" | \
  parse "if(p.appointment) console.log('Rescheduled! Slot:',p.appointment.timeSlot,'Token:',p.appointment.tokenNumber); else console.log('Error:',p.message)"

echo ""
echo "=== TEST 8: Old slot restored, new slot incremented ==="
curl -s "$BASE/api/appointments/slots?centreId=$CENTREID&date=$TOMORROW" -H "Authorization: Bearer $FARMER1" | \
  parse "const old=p.slots.find(x=>x.timeSlot==='08:00-08:30'); const nw=p.slots.find(x=>x.timeSlot==='09:00-09:30'); console.log('08:00-08:30 booked:',old.bookedCount,'(farmer2 remains)'); console.log('09:00-09:30 booked:',nw.bookedCount,'(farmer1 rescheduled)')"

echo ""
echo "=== TEST 9: Cancel appointment ==="
curl -s -X PATCH "$BASE/api/appointments/$APPT1ID/cancel" -H "Content-Type: application/json" -H "Authorization: Bearer $FARMER1" \
  -d '{"cancelReason":"Crop not ready yet"}' | \
  parse "console.log(p.message,'Status:',p.appointment?.status,'Reason:',p.appointment?.cancelReason)"

echo ""
echo "=== TEST 10: Slot restored after cancel ==="
curl -s "$BASE/api/appointments/slots?centreId=$CENTREID&date=$TOMORROW" -H "Authorization: Bearer $FARMER1" | \
  parse "const s=p.slots.find(x=>x.timeSlot==='09:00-09:30'); console.log('09:00-09:30 booked:',s.bookedCount,'(should be 0)')"

echo ""
echo "=== TEST 11: Invalid commodity rejected ==="
curl -s -X POST $BASE/api/appointments -H "Content-Type: application/json" -H "Authorization: Bearer $FARMER1" \
  -d "{\"centreId\":\"$CENTREID\",\"date\":\"$TOMORROW\",\"timeSlot\":\"10:00-10:30\",\"commodity\":\"Grapes\",\"estimatedQuantity\":100}" | \
  parse "console.log('Response:',p.message)"

echo ""
echo "All tests complete!"
