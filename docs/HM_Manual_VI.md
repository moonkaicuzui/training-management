# Quan Ly Thiet Bi Giam Sat Nhiet Do-Do Am 24/7 — Huong Dan Su Dung

**He thong**: Q-TRAIN (He thong Quan ly Dao tao Chat luong)
**Phien ban**: 1.0
**Ngay**: 27-03-2026
**Lien he**: ksmoon@hsvina.com

---

## 1. Tong quan

### Muc dich
Module nay quan ly **kiem tra dinh ky 38 thiet bi giam sat nhiet do-do am tai 35 khu vuc** trong cac co so cua HWK Viet Nam.

### Thay doi
| Truoc day | Sau khi thay doi |
|-----------|-----------------|
| Vo Thi Thuy Linh gui bao cao email thu cong moi 2 tuan | Nhap lieu va quan ly truc tuyen tren he thong Q-TRAIN |
| Khong theo doi duoc lich su | Lich su kiem tra day du + bang dieu khien |
| Kho nhan biet xu huong | Bieu do xu huong thoi gian thuc va the KPI |

### Cac tinh nang chinh
- Nhap ket qua kiem tra cho tat ca 35 khu vuc cung luc
- Bang dieu khien voi the KPI va bieu do xu huong
- Xuat bao cao (Excel / PDF)
- Bao cao email tu dong hang tuan va hang thang

---

## 2. Cach truy cap

### Buoc 1: Mo trinh duyet
Truy cap: **https://q-train-web.web.app**

### Buoc 2: Dang nhap
Su dung tai khoan email cong ty (**@hsvina.com**)

### Buoc 3: Tim menu
Thanh ben trai → **Equipment** → **Humidity Monitor**

---

## 3. Trang cai dat

**URL**: `/equipment/humidity-monitor/settings`

Trang nay hien thi du lieu chinh (master data) cua tat ca **35 khu vuc**.

### Cac thao tac co the thuc hien
| Thao tac | Cach lam |
|----------|---------|
| Xem tat ca khu vuc | Mo trang cai dat — xem danh sach day du |
| Them khu vuc moi | Nhan nut "Them khu vuc" → nhap ten khu vuc, toa nha, so luong muc tieu (T.O) |
| Sua khu vuc | Nhan bieu tuong sua ben canh khu vuc → thay doi thong tin → luu |
| Xoa khu vuc | Nhan bieu tuong xoa ben canh khu vuc → xac nhan |
| Nap du lieu ban dau | Nhan nut "Nap du lieu ban dau" (chi lan dau) — them tat ca 35 khu vuc cung luc |

### Thong tin khu vuc
Moi khu vuc gom:
- **Ten khu vuc**: Ten cua khu vuc (vi du: "A-1F Cutting")
- **Toa nha**: Thuoc toa nha nao (A, B, C, D, E)
- **So luong muc tieu (T.O)**: So thiet bi can co trong khu vuc nay

---

## 4. Trang nhap lieu kiem tra (Trang chinh)

**URL**: `/equipment/humidity-monitor`

Day la **trang quan trong nhat**. Su dung trang nay de nhap ket qua kiem tra.

### Buoc 1: Chon ngay kiem tra
- Nhan vao o nhap ngay
- Chon ngay ban thuc hien kiem tra

### Buoc 2: Nhap ten nguoi kiem tra
- Nhap ten nguoi thuc hien kiem tra

### Buoc 3: Nhap ket qua cho tung khu vuc

Ban se thay bang voi tat ca **35 khu vuc**. Cho moi khu vuc:

| Cot | Y nghia | Cach nhap |
|-----|---------|----------|
| **Khu vuc** | Ten khu vuc | (tu dong dien) |
| **T.O** | So luong muc tieu | (tu dong tu cai dat) |
| **OK** | So thiet bi hoat dong binh thuong | Mac dinh = T.O. Chi thay doi neu khac |
| **NO OK** | So thiet bi khong hoat dong | Mac dinh = 0. Nhap so luong neu co thiet bi bi loi |
| **Tong** | OK + NO OK | (tu dong tinh) |
| **Thieu (Missing)** | Tong - T.O | (tu dong tinh) Hien so am neu thieu thiet bi |
| **Ghi chu (Remark)** | Ghi chu ve van de | **Bat buoc** neu NO OK > 0 hoac Thieu != 0 |

### Cach nhap nhanh
- **Neu tat ca binh thuong**: Khong can thay doi gi. Gia tri mac dinh la OK = T.O, NO OK = 0
- **Neu co van de**: Chi thay doi nhung khu vuc co van de
- **Ghi chu bat buoc**: Neu khu vuc co NO OK > 0 hoac thiet bi bi thieu, ban phai viet ghi chu

### Buoc 4: Luu
- Nhan nut **"Luu tat ca"** o cuoi trang
- Tat ca 35 khu vuc duoc luu cung luc

### Neu da co du lieu
- Neu ban mo ngay da co du lieu, he thong se tai du lieu cu
- Ban co the sua va luu lai (che do cap nhat)

---

## 5. Bang dieu khien (Dashboard)

**URL**: `/equipment/humidity-monitor/dashboard`

Bang dieu khien hien thi trang thai hien tai va xu huong.

### The KPI (Phia tren)
| The | Hien thi |
|-----|----------|
| **Tong thiet bi** | Tong so thiet bi giam sat (38) |
| **OK** | So thiet bi hoat dong binh thuong |
| **NO OK** | So thiet bi khong hoat dong |
| **Thieu (Missing)** | So thiet bi bi thieu |

### Bieu do xu huong ty le OK
- Hien thi ty le OK (%) cua **12 lan kiem tra gan nhat**
- Giup ban thay tinh hinh dang tot len hay xau di

### Bang so sanh theo toa nha
- So sanh trang thai giua cac toa nha: **A, B, C, D, E**
- Hien thi so OK, so NO OK, va ty le OK cua moi toa nha

### Khu vuc co van de lap lai
- Hien thi cac khu vuc co van de **3 lan lien tiep tro len**
- Cac khu vuc nay can duoc chu y dac biet

### Bang lich su kiem tra
- Hien thi tat ca cac lan kiem tra truoc day
- Ban co the nhan vao ban ghi de xem chi tiet

---

## 6. Trang bao cao

**URL**: `/equipment/humidity-monitor/report`

### Cach su dung
1. Chon **ngay bat dau** va **ngay ket thuc**
2. Nhan **"Tao bao cao"**
3. Xuat ra **Excel** hoac **PDF**

### Noi dung bao cao
- Tom tat tat ca cac lan kiem tra trong khoang thoi gian da chon
- Chi tiet tung khu vuc
- Xu huong ty le OK
- Danh sach khu vuc co van de

---

## 7. Bao cao email tu dong

He thong tu dong gui bao cao email:

| Bao cao | Thoi diem | Gio |
|---------|-----------|-----|
| **Bao cao hang tuan** | Moi Chu Nhat | 23:30 |
| **Bao cao hang thang** | Ngay 1 moi thang | 07:00 |

### Bao cao hang thang
- Bao cao tong hop: **Hop than + Thiet bi giam sat nhiet do-do am**
- Bao gom tom tat KPI, xu huong, va khu vuc co van de

### Quan ly nguoi nhan
- Quan tri vien quan ly trong trang **Cai dat email**
- Lien he quan tri vien de them hoac xoa nguoi nhan

---

## 8. Lich trinh kiem tra

| Muc | Chi tiet |
|-----|---------|
| **Tan suat** | 2 tuan 1 lan |
| **Nguoi phu trach** | Vo Thi Thuy Linh (thuylinhrg@hsvina.com) |
| **Phuong phap** | Nhap ket qua tren he thong Q-TRAIN |

### Luu y quan trong
- Vui long nhap ket qua kiem tra ngay trong ngay thuc hien kiem tra
- Nho ghi chu cho cac khu vuc co van de
- Neu co cau hoi, lien he: **ksmoon@hsvina.com**

---

*He thong Q-TRAIN — Bo phan QIP HWK Viet Nam*
*Ngay tao tai lieu: 27-03-2026*
