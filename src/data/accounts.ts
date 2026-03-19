// Danh sách tài khoản được phép đăng nhập
export interface UserAccount {
  username: string;
  password: string;
  name: string;
}

export const ACCOUNTS: UserAccount[] = [
  { username: "duonghangdtntls@gmail.com", password: "SKKN100", name: "GV" },
  { username: "vohoaitam87@gmail.com", password: "SKKN100", name: "GV" },
  { username: "Masavu97@gmail.com", password: "SKKN100", name: "GV" },
  { username: "VIPKIMCUONG", password: "123456", name: "GV" },
];
