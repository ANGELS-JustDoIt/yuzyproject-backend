import * as postRepository from "../data/post.mjs";
import * as fileRepository from "../data/file.mjs";
import * as likeRepository from "../data/like.mjs";
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

    // 잔디에 게시글 작성 활동 기록
    try {
      await postRepository.recordBoardGrass(userIdx);
    } catch (grassError) {
      // 잔디 기록 실패해도 포스트 생성은 성공 처리
      console.error("잔디 기록 에러:", grassError);
    }

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

// 게시글 상세 조회
export async function getPost(req, res, next) {
  try {
    const boardId = parseInt(req.params.id);
    if (!boardId || isNaN(boardId)) {
      return res
        .status(400)
        .json({ message: "유효하지 않은 포스트 ID입니다." });
    }

    const post = await postRepository.getById(boardId);
    if (!post) {
      return res.status(404).json({ message: "포스트를 찾을 수 없습니다." });
    }

    // 조회수 증가
    await postRepository.incrementViews(boardId);

    // 파일 목록 조회
    const files = await fileRepository.getFilesByBoardId("post", boardId);

    // 각 파일에 isMainImage 플래그 추가
    const filesWithMainFlag = files.map((file) => {
      const fileObj = toCamelCase(file);
      fileObj.isMainImage = file.file_key === post.main_image_id;
      return fileObj;
    });

    // 좋아요 개수 조회
    const likeCount = await likeRepository.getLikeCount("post", boardId);

    const postData = toCamelCase(post);
    postData.likeCount = likeCount;

    res.status(200).json({
      post: postData,
      files: filesWithMainFlag,
    });
  } catch (error) {
    console.error("포스트 조회 에러:", error);
    res.status(500).json({
      message: "포스트 조회에 실패했습니다.",
      error: error.message,
    });
  }
}

// 게시글 목록 조회 (페이지, 타입, 키워드)
export async function getPosts(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { type, keyword } = req.query;

    const posts = await postRepository.getPosts({
      page,
      limit,
      type,
      keyword,
    });
    const total = await postRepository.countPosts({ type, keyword });

    const totalPages = Math.ceil(total / limit) || 1;

    // 여러 게시글의 좋아요 개수를 한 번에 조회
    const boardIds = posts.map((post) => post.board_id);
    const likeCounts = await likeRepository.getLikeCountsByBoardIds(
      "post",
      boardIds
    );

    // 각 게시글에 좋아요 개수 추가
    const postsWithLikes = posts.map((post) => {
      const postData = toCamelCase(post);
      postData.likeCount = likeCounts[post.board_id] || 0;
      return postData;
    });

    res.status(200).json({
      posts: postsWithLikes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("게시글 목록 조회 에러:", error);
    res.status(500).json({
      message: "게시글 목록 조회에 실패했습니다.",
      error: error.message,
    });
  }
}

// 게시글 삭제
export async function deletePost(req, res, next) {
  try {
    const boardId = parseInt(req.params.id);
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

    if (existingPost.user_idx !== userIdx) {
      return res
        .status(403)
        .json({ message: "본인의 포스트만 삭제할 수 있습니다." });
    }

    // 1. 게시글에 연결된 파일 목록 조회 (파일 시스템에서 삭제하기 위해)
    const files = await fileRepository.getFilesByBoardId("post", boardId);

    // 2. 파일 시스템에서 파일 삭제
    for (const file of files) {
      const filePath = `.${file.file_path}`; // /uploads/... -> ./uploads/...
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileError) {
          console.error(`파일 삭제 실패: ${filePath}`, fileError);
          // 파일 삭제 실패해도 계속 진행
        }
      }
    }

    // 3. 데이터베이스에서 파일 삭제
    await fileRepository.deleteFilesByBoardId("post", boardId);

    // 4. 게시글 삭제 (댓글과 좋아요는 DB CASCADE 또는 별도 처리 필요)
    const result = await postRepository.deleteById(boardId, userIdx);
    console.log(result);
    if (result[0].affectedRows === 0) {
      return res.status(404).json({ message: "포스트를 찾을 수 없습니다." });
    }

    res.status(200).json({
      message: "포스트가 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("포스트 삭제 에러:", error);
    res.status(500).json({
      message: "포스트 삭제에 실패했습니다.",
      error: error.message,
    });
  }
}
