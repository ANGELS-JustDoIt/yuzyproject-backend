import * as likeRepository from "../data/like.mjs";
import * as postRepository from "../data/post.mjs";

const BOARD_TYPE = "post";

// 좋아요 토글 (추가/삭제)
export async function toggleLike(req, res, next) {
  try {
    const boardId = parseInt(req.params.id);
    const userIdx = req.userIdx;

    if (!boardId || isNaN(boardId)) {
      return res
        .status(400)
        .json({ message: "유효하지 않은 포스트 ID입니다." });
    }

    // 포스트 존재 확인
    const post = await postRepository.getById(boardId);
    if (!post) {
      return res.status(404).json({ message: "포스트를 찾을 수 없습니다." });
    }

    // 이미 좋아요를 눌렀는지 확인
    const existingLike = await likeRepository.getLikeByUser(
      BOARD_TYPE,
      boardId,
      userIdx
    );

    if (existingLike) {
      // 좋아요 취소
      await likeRepository.deleteLike(BOARD_TYPE, boardId, userIdx);
      const likeCount = await likeRepository.getLikeCount(BOARD_TYPE, boardId);
      res.status(200).json({
        message: "좋아요가 취소되었습니다.",
        isLiked: false,
        likeCount,
      });
    } else {
      // 좋아요 추가
      await likeRepository.createLike(BOARD_TYPE, boardId, userIdx);
      const likeCount = await likeRepository.getLikeCount(BOARD_TYPE, boardId);
      res.status(200).json({
        message: "좋아요가 추가되었습니다.",
        isLiked: true,
        likeCount,
      });
    }
  } catch (error) {
    console.error("좋아요 토글 에러:", error);
    res.status(500).json({
      message: "좋아요 처리에 실패했습니다.",
      error: error.message,
    });
  }
}

// 좋아요 상태 조회
export async function getLikeStatus(req, res, next) {
  try {
    const boardId = parseInt(req.params.id);
    const userIdx = req.userIdx;

    if (!boardId || isNaN(boardId)) {
      return res
        .status(400)
        .json({ message: "유효하지 않은 포스트 ID입니다." });
    }

    // 포스트 존재 확인
    const post = await postRepository.getById(boardId);
    if (!post) {
      return res.status(404).json({ message: "포스트를 찾을 수 없습니다." });
    }

    // 좋아요 상태 및 개수 조회
    const like = await likeRepository.getLikeByUser(
      BOARD_TYPE,
      boardId,
      userIdx
    );
    const likeCount = await likeRepository.getLikeCount(BOARD_TYPE, boardId);

    res.status(200).json({
      isLiked: !!like,
      likeCount,
    });
  } catch (error) {
    console.error("좋아요 상태 조회 에러:", error);
    res.status(500).json({
      message: "좋아요 상태 조회에 실패했습니다.",
      error: error.message,
    });
  }
}

// 좋아요 개수만 조회
export async function getLikeCountOnly(req, res, next) {
  try {
    const boardId = parseInt(req.params.id);

    if (!boardId || isNaN(boardId)) {
      return res
        .status(400)
        .json({ message: "유효하지 않은 포스트 ID입니다." });
    }

    // 포스트 존재 확인
    const post = await postRepository.getById(boardId);
    if (!post) {
      return res.status(404).json({ message: "포스트를 찾을 수 없습니다." });
    }

    const likeCount = await likeRepository.getLikeCount(BOARD_TYPE, boardId);

    res.status(200).json({
      likeCount,
    });
  } catch (error) {
    console.error("좋아요 개수 조회 에러:", error);
    res.status(500).json({
      message: "좋아요 개수 조회에 실패했습니다.",
      error: error.message,
    });
  }
}
