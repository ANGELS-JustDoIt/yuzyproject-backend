import * as postRepository from "../data/post.mjs";
import * as fileRepository from "../data/file.mjs";

// snake_case를 camelCase로 변환하는 헬퍼 함수
function toCamelCase(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const camelObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    );
    camelObj[camelKey] = value;
  }
  return camelObj;
}

// 포스트를 작성하는 함수 (파일 포함)
export async function createPost(req, res, next) {
  try {
    const { title, type, content } = req.body;
    const user_idx = req.user_idx; // 인증 미들웨어에서 설정된 user ID
    // 1. 먼저 포스트 생성 (main_image_id는 null로 시작)
    const post = await postRepository.create(
      title,
      type,
      content,
      user_idx,
      null
    );
    const boardId = post.board_id;
    let mainImageId = null;
    let seq = 0;
    // 2. 메인 이미지 처리
    if (req.files && req.files.mainImage && req.files.mainImage.length > 0) {
      const mainImageFile = req.files.mainImage[0];
      const filePath = `/uploads/${mainImageFile.filename}`;
      mainImageId = await fileRepository.createFile(
        "post",
        boardId,
        filePath,
        mainImageFile.originalname,
        user_idx,
        seq
      );
      seq++;
      await postRepository.updateMainImage(boardId, mainImageId);
    }
    // 3. 첨부 파일들 처리
    if (req.files && req.files.files && req.files.files.length > 0) {
      const filePromises = req.files.files.map(async (file) => {
        const filePath = `/uploads/${file.filename}`;
        const fileKey = await fileRepository.createFile(
          "post",
          boardId,
          filePath,
          file.originalname,
          user_idx,
          seq
        );
        seq++;
        return fileKey;
      });
      await Promise.all(filePromises);
    }
    // 4. 최종 포스트 정보 조회 (main_image_id 포함)
    const finalPost = await postRepository.getById(boardId);
    res.status(201).json({
      message: "포스트가 성공적으로 생성되었습니다.",
      post: toCamelCase(finalPost),
    });
  } catch (error) {
    console.error("포스트 생성 에러:", error);
    res
      .status(500)
      .json({ message: "포스트 생성에 실패했습니다.", error: error.message });
  }
}
