// Mots : orthographe et sens relus un par un. `p` = pictogramme (vide : nom propre ou mot abstrait).
export interface Word { w: string; p: string; fr: string }
const W = (w: string, p: string, fr: string): Word => ({ w, p, fr });
export const WORDS: Word[] = [
  W('아이', 'child', 'enfant'), W('오이', 'cucumber', 'concombre'), W('우유', 'milk', 'lait'), W('고기', 'meat', 'viande'), W('누나', '', 'grande sœur (d’un garçon)'), W('나무', 'tree', 'arbre'), W('구두', 'shoe', 'chaussures de ville'),
  W('나라', 'flag', 'pays'), W('바다', 'sea', 'mer'), W('도시', 'city', 'ville'), W('치마', 'skirt', 'jupe'), W('아기', 'baby', 'bébé'), W('하나', 'one', 'un'), W('산', 'mountain', 'montagne'), W('물', 'water', 'eau'), W('강', 'river', 'fleuve'),
  W('밥', 'rice', 'riz cuit, repas'), W('개', 'dog', 'chien'), W('여우', 'fox', 'renard'), W('을지로', '', 'Euljiro (quartier)'), W('비', 'rain', 'pluie'), W('다리', 'bridge', 'pont ; jambe'), W('소', 'cow', 'vache'), W('차', 'tea', 'thé ; voiture'),
  W('문', 'door', 'porte'), W('집', 'house', 'maison'), W('새', 'bird', 'oiseau'), W('호수', 'lake', 'lac'),
  W('커피', 'coffee', 'café (boisson)'), W('버스', 'bus', 'bus'), W('택시', 'taxi', 'taxi'), W('피자', 'pizza', 'pizza'), W('호텔', 'hotel', 'hôtel'), W('치킨', 'chicken', 'poulet frit'), W('카페', 'cafe', 'café (lieu)'), W('메뉴', 'menu', 'menu'),
  W('바나나', 'banana', 'banane'), W('주스', 'juice', 'jus'), W('콜라', 'cola', 'cola'), W('토마토', 'tomato', 'tomate'), W('카메라', 'camera', 'appareil photo'), W('피아노', 'piano', 'piano'), W('게임', 'game', 'jeu'), W('햄버거', 'burger', 'hamburger'),
  W('케이크', 'cake', 'gâteau'), W('아이스크림', 'icecream', 'glace'), W('와이파이', 'wifi', 'wifi'), W('홍대', '', 'Hongdae (quartier)'),
  W('은행', 'bank', 'banque'), W('약국', 'pharmacy', 'pharmacie'), W('편의점', 'store', 'supérette'), W('서점', 'bookstore', 'librairie'), W('식당', 'restaurant', 'restaurant'), W('병원', 'hospital', 'hôpital'), W('화장실', 'toilet', 'toilettes'),
  W('출구', 'exit', 'sortie'), W('입구', 'entrance', 'entrée'), W('지하철', 'subway', 'métro'), W('역', 'station', 'gare, station'), W('서울', 'seoul', 'Séoul'), W('공항', 'airport', 'aéroport'), W('시장', 'market', 'marché'), W('영화', 'movie', 'film'),
  W('백화점', 'dept', 'grand magasin'), W('꽃', 'flower', 'fleur'), W('빵', 'bread', 'pain'), W('옷', 'clothes', 'vêtements'), W('명동', '', 'Myeongdong (quartier)'),
  W('라면', 'ramen', 'ramyeon'), W('김밥', 'gimbap', 'gimbap'), W('맥주', 'beer', 'bière'), W('소주', 'soju', 'soju'), W('치맥', 'chimaek', 'poulet frit et bière'), W('비빔밥', 'bibimbap', 'bibimbap'), W('떡볶이', 'tteokbokki', 'tteokbokki'),
  W('냉면', 'naengmyeon', 'nouilles froides'), W('만두', 'mandu', 'raviolis'), W('김치', 'kimchi', 'kimchi'), W('불고기', 'bulgogi', 'bulgogi'), W('삼겹살', 'samgyeopsal', 'poitrine de porc grillée'), W('순대', 'sundae', 'boudin coréen'), W('호떡', 'hotteok', 'crêpe fourrée'),
  W('국', 'soup', 'soupe'), W('파전', 'pajeon', 'galette à la ciboule'), W('쌀', 'rawrice', 'riz cru'), W('찌개', 'stew', 'ragoût'), W('광장시장', '', 'marché de Gwangjang'),
  W('노래방', 'karaoke', 'karaoké'), W('공원', 'park', 'parc'), W('자전거', 'bike', 'vélo'), W('배', 'boat', 'bateau ; poire'), W('달', 'moon', 'lune'), W('별', 'star', 'étoile'), W('밤', 'night', 'nuit'), W('바람', 'wind', 'vent'), W('음악', 'music', 'musique'),
  W('사랑', 'love', 'amour'), W('친구', 'friend', 'ami'), W('사진', 'photo', 'photo'), W('사과', 'apple', 'pomme'), W('돼지', 'pig', 'cochon'), W('회', 'fish', 'poisson cru'), W('가위', 'scissors', 'ciseaux'), W('의자', 'chair', 'chaise'), W('한강', 'hangang', 'fleuve Han'),
  W('강남', '', 'Gangnam'), W('서울역', '', 'gare de Séoul'), W('시청', '', 'hôtel de ville'), W('잠실', '', 'Jamsil'), W('종로', '', 'Jongno'), W('이태원', '', 'Itaewon'), W('신촌', '', 'Sinchon'), W('동대문', '', 'Dongdaemun'), W('홍대입구', '', 'station Hongik Univ.'),
  W('시계', 'clock', 'montre, horloge'), W('얘기', 'talk', 'histoire, conversation'), W('웨이터', 'waiter', 'serveur'), W('원', 'won', 'won'),
  // clins d'œil et secrets (jamais demandés, seulement lisibles)
  W('하이퍼리퀴드', 'bar', 'Hyperliquid'), W('리그 오브 레전드', 'pc', 'League of Legends'), W('피시방', 'pc', 'PC bang'), W('파델', 'padel', 'padel'), W('놀란', 'movie', 'Nolan'), W('파스타', 'pasta', 'pâtes'), W('엘피바', 'vinyl', 'bar à vinyles'), W('오락실', 'arcade', 'salle d’arcade'),
  // réserve du défi du jour
  W('모자', '', 'chapeau'), W('바지', '', 'pantalon'), W('요리', '', 'cuisine'), W('구름', '', 'nuage'), W('하늘', '', 'ciel'), W('우산', '', 'parapluie'), W('고양이', '', 'chat'), W('거리', '', 'rue'), W('가게', '', 'boutique'), W('여행', '', 'voyage'), W('지도', '', 'carte'), W('기차', '', 'train'), W('표', '', 'billet'), W('돈', '', 'argent'), W('술', '', 'alcool'), W('안주', '', 'amuse-bouche'), W('건배', '', 'santé !'), W('맛', '', 'goût'), W('불', '', 'feu ; lumière'), W('눈', '', 'neige ; œil'),
];
export const WD: Record<string, Word> = Object.fromEntries(WORDS.map((x) => [x.w, x]));
export const DAILY = ['모자', '바지', '요리', '구름', '하늘', '우산', '고양이', '거리', '가게', '여행', '지도', '기차', '표', '돈', '술', '안주', '건배', '맛', '불', '눈'];
// quartiers = chapitres. n : jamo introduits ; syl : blocs à assembler ; t : nature du niveau
export interface Sign { w: string; n?: string; syl?: string; t: 'i' | 'b' | 'w' | 'r' | 'l' | 's'; ws?: string }
export interface District { id: string; name: string; col: [string, string, string]; signs: Sign[]; secrets: string[] }
const S = (w: string, t: Sign['t'], n = '', syl = '', ws = ''): Sign => ({ w, t, n, syl, ws });
export const DISTRICTS: District[] = [
  { id: 'eulji', name: '을지로', col: ['#ffb347', '#3fe0d0', '#ff4d5a'], secrets: ['밥', '시계'], signs: [
    S('아이', 'i', 'ㅏㅣ'), S('오이', 'i', 'ㅗㅜ'), S('우유', 'i', 'ㅓㅡ'), S('고기', 'b', 'ㄱㅋ', '가기고구커크'), S('누나', 'b', 'ㄴ', '나누노니'), S('나무', 'b', 'ㅁ', '마무모미'), S('구두', 'b', 'ㄷㅌ', '다두도타토'),
    S('나라', 'b', 'ㄹ', '라로리루', '다리'), S('바다', 'b', 'ㅂㅍ', '바비보파포', '비'), S('도시', 'b', 'ㅅ', '사소수시', '소'), S('치마', 'b', 'ㅈㅊ', '자주지차추치', '차'), S('아기', 'b', 'ㅇ', '아오우이', '아이 오이'), S('하나', 'b', 'ㅎ', '하호후히', '호수'),
    S('산', 'b', '', '산문손', '문'), S('물', 'b', '', '물달발'), S('강', 'b', '', '강방공'), S('밥', 'b', '', '밥집입', '집'), S('개', 'b', 'ㅐㅔ', '개새배네', '새'), S('여우', 'b', 'ㅑㅕㅛㅠ', '야여요유', '우유'), S('을지로', 'w') ] },
  { id: 'hongdae', name: '홍대', col: ['#ff3ea5', '#4d7cff', '#ffe14d'], secrets: ['피시방', '리그 오브 레전드', '엘피바'], signs: [
    S('커피', 'w'), S('버스', 'w'), S('택시', 'w'), S('피자', 'w'), S('호텔', 'w'), S('치킨', 'w'), S('카페', 'w'), S('메뉴', 'w'), S('바나나', 'w'), S('주스', 'w'), S('콜라', 'w'), S('토마토', 'w'), S('카메라', 'w'), S('피아노', 'w'),
    S('게임', 'w'), S('햄버거', 'w'), S('케이크', 'w'), S('아이스크림', 'w'), S('와이파이', 'w', 'ㅘ'), S('홍대', 'w') ] },
  { id: 'myeong', name: '명동', col: ['#ff3b3b', '#ffd0e0', '#4dff88'], secrets: ['놀란', '파스타'], signs: [
    S('은행', 'r'), S('약국', 'r'), S('서점', 'r'), S('식당', 'r'), S('출구', 'r'), S('입구', 'r'), S('역', 'r'), S('서울', 'r'), S('시장', 'r'), S('공항', 'r'), S('지하철', 'r'), S('영화', 'r'), S('화장실', 'r'), S('백화점', 'r'),
    S('병원', 'r', 'ㅝ'), S('편의점', 'r', 'ㅢ'), S('옷', 'r'), S('꽃', 'r', 'ㄲ'), S('빵', 'r', 'ㅃ'), S('명동', 'l') ] },
  { id: 'gwang', name: '광장시장', col: ['#ff8a3d', '#6dff9c', '#fff2d0'], secrets: ['오락실'], signs: [
    S('라면', 'r'), S('김밥', 'w'), S('맥주', 'r'), S('소주', 'w'), S('고기', 'r'), S('치맥', 'w'), S('비빔밥', 'r'), S('만두', 'w'), S('김치', 'r'), S('냉면', 'w'), S('불고기', 'r'), S('국', 'w'), S('삼겹살', 'r'), S('호떡', 'r', 'ㄸ'),
    S('떡볶이', 'w'), S('순대', 'r'), S('파전', 'w'), S('쌀', 'r', 'ㅆ'), S('찌개', 'r', 'ㅉ'), S('광장시장', 'l') ] },
  { id: 'hangang', name: '한강', col: ['#49a6ff', '#a66bff', '#ffcf70'], secrets: ['파델'], signs: [
    S('다리', 's'), S('달', 'r'), S('별', 'w'), S('밤', 'r'), S('비', 's'), S('바람', 'r'), S('배', 's'), S('공원', 'r'), S('자전거', 'w'), S('노래방', 'r'), S('음악', 'w'), S('사랑', 'r'), S('친구', 'w'), S('사진', 'r'),
    S('사과', 's'), S('돼지', 'r', 'ㅙ'), S('회', 'r', 'ㅚ'), S('가위', 'r', 'ㅟ'), S('의자', 's'), S('한강', 'l') ] },
  { id: 'gangnam', name: '강남', col: ['#d8f0ff', '#35e0ff', '#ff5fa8'], secrets: ['하이퍼리퀴드'], signs: [
    S('서울역', 'l'), S('시청', 'l'), S('잠실', 'l'), S('종로', 'l'), S('이태원', 'l'), S('신촌', 'l'), S('동대문', 'l'), S('홍대입구', 'l'), S('커피', 's'), S('출구', 's'), S('시계', 'r', 'ㅖ'), S('얘기', 'r', 'ㅒ'), S('웨이터', 'r', 'ㅞ'),
    S('원', 'r'), S('택시', 's'), S('호텔', 's'), S('맥주', 's'), S('화장실', 's'), S('지하철', 's'), S('강남', 'l') ] },
];
