import * as postRepository from "../data/post.mjs";
import * as fileRepository from "../data/file.mjs";
import fs from "fs";

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
    const userIdx = req.userIdx; // 인증 미들웨어에서 설정된 user ID
    // 1. 먼저 포스트 생성 (main_image_id는 null로 시작)
    const post = await postRepository.create(
      title,
      type,
      content,
      userIdx,
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
        userIdx,
        seq
      );
      seq++;
      await postRepository.updateMainImage(boardId, mainImageId);
    }
    // 3. 첨부 파일들 처리
    if (req.files && req.files.files && req.files.files.length > 0) {
      for (const file of req.files.files) {
        const filePath = `/uploads/${file.filename}`;
        await fileRepository.createFile(
          "post",
          boardId,
        filePath,
        file.originalname,
        userIdx,
          seq
        );
        seq++; // seq가 하나씩 추가되는 방식으로 (동기 방식으로 변경):sync/ ** 비동기가 async (한꺼번에 동시처리)
      }
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

// 포스트 업데이트 (파일 업로드 포함)
export async function updatePost(req, res, next) {
  try {
    const boardId = parseInt(req.params.id);
    const { title, content } = req.body;
    const userIdx = req.userIdx;
    if (!boardId || isNaN(boardId)) {
      return res
        .status(400)
        .json({ message: "유효하지 않은 포스트 ID입니다." });
    }

    // 포스트 존재 및 소유권 확인
    const existingPost = await postRepository.getById(boardId);
    if (!existingPost) {
      return res.status(404).json({ message: "포스트를 찾을 수 없습니다." });
    }
    console.log("aaaa");
    console.log(existingPost);
    console.log(userIdx);
    if (existingPost.user_idx !== userIdx) {
      return res
        .status(403)
        .json({ message: "본인의 포스트만 수정할 수 있습니다." });
    }

    // 1. 포스트 기본 정보 업데이트 (type은 변경 불가)
    await postRepository.update(boardId, title, content, userIdx);

    // 기존 파일 목록 조회하여 seq 계산 (files ) -> 파일 추가 하면 seq 번호가 변경되는 것이 아니라 추가 됨. ex: 0,1,2 이미지를 변경하면 3,4,5 가 됨.

    const existingFiles = await fileRepository.getFilesByBoardId(
      "post",
      boardId
    );
    const maxSeq =
      existingFiles.length > 0
        ? Math.max(...existingFiles.map((f) => f.seq))
        : -1;
    let seq = maxSeq + 1;
    let mainImageId = existingPost.main_image_id;

    // 2. 메인 이미지 처리 (새로 업로드된 경우)
    if (req.files && req.files.mainImage && req.files.mainImage.length > 0) {
      const mainImageFile = req.files.mainImage[0];
      const filePath = `/uploads/${mainImageFile.filename}`;
      mainImageId = await fileRepository.createFile(
        "post",
        boardId,
        filePath,
        mainImageFile.originalname,
        userIdx,
        seq
      );
      seq++;
      await postRepository.updateMainImage(boardId, mainImageId);
    }

    // 3. 첨부 파일들 처리 (새로 추가)
    if (req.files && req.files.files && req.files.files.length > 0) {
      for (const file of req.files.files) {
        const filePath = `/uploads/${file.filename}`;
        await fileRepository.createFile(
          "post",
          boardId,
          filePath,
          file.originalname,
          userIdx,
          seq
        );
        seq++;
      }
    }

    // 4. 최종 포스트 정보 조회 (업데이트된 정보 포함)
    const finalPost = await postRepository.getById(boardId);
    res.status(200).json({
      message: "포스트가 성공적으로 수정되었습니다.",
      post: toCamelCase(finalPost),
    });
  } catch (error) {
    console.error("포스트 수정 에러:", error);

    // 에러 발생 시 업로드된 파일 정리 (DB Insert 실패시.. ex) 서버 에러 등)
    const allFiles = [];
    if (req.files) {
      if (req.files.mainImage) allFiles.push(...req.files.mainImage);
      if (req.files.files) allFiles.push(...req.files.files);
    }
    allFiles.forEach((file) => {
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (fileError) {
          console.error(`파일 삭제 실패: ${file.path}`, fileError);
        }
      }
    });
    res.status(500).json({
      message: "포스트 수정에 실패했습니다.",
      error: error.message,
    });
  }
}
