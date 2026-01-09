// ================================================================
// ⚙️ FILE CẤU HÌNH SHOP KARYNA ALL (UPDATE GIÁ MỚI NHẤT)
// ================================================================

const SHOP_CONFIG = {
    // 1. CÀI ĐẶT CHUNG
    websiteName: "KARYNA ALL",
    discordInvite: "https://discord.gg/kFyfeKNrPk", // Link Discord của bạn
    
    // 2. DANH SÁCH SẢN PHẨM & GIÁ
    products: [
        {
            id: "melee",
            name: "Cày Melee (Võ)",
            image: "https://trinhvantuyen.com/wp-content/uploads/2022/09/cay-thue-blox-fruit-gia-re-uy-tin-1.jpg", 
            tag: "HOT",
            tagColor: "red",
            description: "Cày Sanguine Art và các loại Melee khác.",
            packages: [
                { name: "🩸 Sanguine Art (A – Z)", price: 50000 },
                { name: "👊 Các Melee khác (God/Shark/Electric...)", price: 20000 }
            ]
        },
        {
            id: "leviathan",
            name: "Dịch Vụ Leviathan",
            image: "https://i.ytimg.com/vi/b1938838-66e7-4d2c-90ba-b5cabb0f13a5/maxresdefault.jpg",
            tag: "VIP",
            tagColor: "blue",
            description: "Săn tim, cuộn đỏ, treo Leviathan tỷ lệ cao.",
            packages: [
                { name: "❤️ 1 Tim Levi (Kèm Hydra/Tiki - K vảy)", price: 10000 },
                { name: "📜 10 Cuộn Đỏ", price: 20000 },
                { name: "⚓ Treo Levi 8 ngày (50+ Cuộn)", price: 50000 }
            ]
        },
        {
            id: "toc-v4",
            name: "Up Tộc V4 & Draco",
            image: "https://i.ytimg.com/vi/d1128fd5-90aa-413d-ab87-1f24263544d3/maxresdefault.jpg",
            tag: "FAST",
            tagColor: "purple",
            description: "Full Gear V4, lấy Draco, Ghoul, Cyborg.",
            packages: [
                { name: "⚙️ 1 Gear Tộc V4", price: 10000 },
                { name: "🌕 Full Gear (FG)", price: 50000 },
                { name: "💳 Tìm Đảo Bí Ẩn (Card)", price: 70000 },
                { name: "🧟 Lấy Tộc Ghoul / Cyborg", price: 40000 },
                { name: "🦖 Lấy Draco (Đủ nguyên liệu)", price: 10000 },
                { name: "🆙 Draco V1 – V3", price: 20000 },
                { name: "⚙️ 1 Gear Draco", price: 10000 },
                { name: "🌕 Full Gear Draco", price: 50000 }
            ]
        },
        {
            id: "sword-gun",
            name: "Cày Kiếm & Súng (Sword)",
            image: "https://i.ytimg.com/vi/78b543de-5874-4a99-839a-683f08c9324e/hq720.jpg",
            tag: "NEW",
            tagColor: "orange",
            description: "Lấy CDK, Shark Anchor, Soul Guitar uy tín.",
            packages: [
                { name: "🗡️ Cursed Dual Katana (CDK) A-Z", price: 30000 },
                { name: "⚓ Shark Anchor A-Z", price: 30000 },
                { name: "🎸 Soul Guitar A-Z", price: 30000 },
                { name: "⚔️ Các đồ hiếm khác (Ib báo giá)", price: 0 }
            ]
        },
        {
            id: "mastery-money",
            name: "Mastery - Beli - Fragments",
            image: "https://i.ytimg.com/vi/p8g1a0s6Oms/maxresdefault.jpg",
            tag: "SALE",
            tagColor: "green",
            description: "Cày thông thạo, Fragment, Beli cực nhanh.",
            packages: [
                { name: "💎 10k Fragments", price: 10000 },
                { name: "💵 10 Triệu Beli", price: 10000 },
                { name: "📈 1 - 300 Mastery", price: 20000 },
                { name: "📈 300 - 600 Mastery", price: 30000 }
            ]
        }
    ],

    // 3. CÀI ĐẶT API GIẢ LẬP
    apiSettings: {
        fakeDelay: 2000, 
        successMessage: "Đơn hàng đã gửi thành công! Shop sẽ liên hệ lại trong 24h."
    }
};