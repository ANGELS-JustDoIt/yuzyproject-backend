import * as commentRepository from "../data/comment.mjs";
import * as postRepository from "../data/post.mjs";
import * as myRepository from "../data/my.mjs";

// snake_case를 camelCase로 변환하는 헬퍼 함수
function toCamelCase(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item));
  }
  const camelObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    );
    camelObj[camelKey] = value;
  }
  return camelObj;
}

// 댓글 작성
export async function createComment(req, res, next) {
  try {
    const boardId = parseInt(req.params.id);
    const { reply } = req.body;
    const userIdx = req.userIdx;

    if (!boardId || isNaN(boardId)) {
      return res
        .status(400)
        .json({ message: "유효하지 않은 포스트 ID입니다." });
    }

    if (!reply || reply.trim().length === 0) {
      return res.status(400).json({ message: "댓글 내용을 입력하세요." });
    }

    // 포스트 존재 확인
    const post = await postRepository.getById(boardId);
    if (!post) {
      return res.status(404).json({ message: "포스트를 찾을 수 없습니다." });
    }

    // 최대 seq 값 조회하여 다음 seq 계산
    const maxSeq = await commentRepository.getMaxSeqByBoardId(boardId);
    const nextSeq = maxSeq + 1;

    // 댓글 생성
    const comment = await commentRepository.create(
      boardId,
      reply.trim(),
      userIdx,
      nextSeq
    );

    // 게시글 작성자에게 알림 생성 (본인이 자기 글에 다는 댓글은 제외)
    if (post.user_idx && post.user_idx !== userIdx) {
      try {
        await myRepository.createNotification(
          post.user_idx,
          "COMMENT",
          String(boardId),
          "내 게시글에 새로운 댓글이 달렸습니다."
        );
      } catch (notiError) {
        console.error("댓글 알림 생성 에러:", notiError);
        // 알림 생성 실패해도 댓글 작성은 성공으로 처리
      }
    }

    res.status(201).json({
      message: "댓글이 성공적으로 작성되었습니다.",
      comment: toCamelCase(comment),
    });
  } catch (error) {
    console.error("댓글 작성 에러:", error);
    res.status(500).json({
      message: "댓글 작성에 실패했습니다.",
      error: error.message,
    });
  }
}

// 댓글 목록 조회 (게시글의 모든 댓글)
export async function getComments(req, res, next) {
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

    // 댓글 목록 조회
    const comments = await commentRepository.getByBoardId(boardId);
    const commentCount = await commentRepository.countByBoardId(boardId);

    res.status(200).json({
      comments: toCamelCase(comments),
      commentCount,
    });
  } catch (error) {
    console.error("댓글 목록 조회 에러:", error);
    res.status(500).json({
      message: "댓글 목록 조회에 실패했습니다.",
      error: error.message,
    });
  }
}

// 댓글 상세 조회
export async function getComment(req, res, next) {
  try {
    const replyId = parseInt(req.params.replyId);

    if (!replyId || isNaN(replyId)) {
      return res
        .status(400)
        .json({ message: "유효하지 않은 댓글 ID입니다." });
    }

    const comment = await commentRepository.getById(replyId);
    if (!comment) {
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }

    res.status(200).json({
      comment: toCamelCase(comment),
    });
  } catch (error) {
    console.error("댓글 조회 에러:", error);
    res.status(500).json({
      message: "댓글 조회에 실패했습니다.",
      error: error.message,
    });
  }
}

// 댓글 수정
export async function updateComment(req, res, next) {
  try {
    const replyId = parseInt(req.params.replyId);
    const { reply } = req.body;
    const userIdx = req.userIdx;

    if (!replyId || isNaN(replyId)) {
      return res
        .status(400)
        .json({ message: "유효하지 않은 댓글 ID입니다." });
    }

    if (!reply || reply.trim().length === 0) {
      return res.status(400).json({ message: "댓글 내용을 입력하세요." });
    }

    // 댓글 존재 및 소유권 확인
    const existingComment = await commentRepository.getById(replyId);
    if (!existingComment) {
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }

    if (existingComment.user_idx !== userIdx) {
      return res
        .status(403)
        .json({ message: "본인의 댓글만 수정할 수 있습니다." });
    }

    // 댓글 수정
    const updatedComment = await commentRepository.update(
      replyId,
      reply.trim(),
      userIdx
    );

    res.status(200).json({
      message: "댓글이 성공적으로 수정되었습니다.",
      comment: toCamelCase(updatedComment),
    });
  } catch (error) {
    console.error("댓글 수정 에러:", error);
    res.status(500).json({
      message: "댓글 수정에 실패했습니다.",
      error: error.message,
    });
  }
}

// 댓글 삭제
export async function deleteComment(req, res, next) {
  try {
    const replyId = parseInt(req.params.replyId);
    const userIdx = req.userIdx;

    if (!replyId || isNaN(replyId)) {
      return res
        .status(400)
        .json({ message: "유효하지 않은 댓글 ID입니다." });
    }

    // 댓글 존재 및 소유권 확인
    const existingComment = await commentRepository.getById(replyId);
    if (!existingComment) {
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }

    if (existingComment.user_idx !== userIdx) {
      return res
        .status(403)
        .json({ message: "본인의 댓글만 삭제할 수 있습니다." });
    }

    // 잔디 처리에 사용할 댓글 작성 날짜 (YYYY-MM-DD)
    const createdAt = existingComment.created_at;
    const createdDate =
      createdAt instanceof Date
        ? createdAt.toISOString().split("T")[0]
        : String(createdAt).split("T")[0];

    // 댓글 삭제
    await commentRepository.deleteById(replyId, userIdx);

    // 해당 날짜에 더 이상 댓글이 없으면 잔디(is_reply) 제거
    try {
      await commentRepository.clearReplyGrassIfNoCommentsOnDate(
        userIdx,
        createdDate
      );
    } catch (grassError) {
      console.error("댓글 삭제 후 잔디 제거 처리 중 에러:", grassError);
      // 잔디 제거 실패해도 댓글 삭제 자체는 성공으로 처리
    }

    res.status(200).json({
      message: "댓글이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("댓글 삭제 에러:", error);
    res.status(500).json({
      message: "댓글 삭제에 실패했습니다.",
      error: error.message,
    });
  }
}

// 댓글 채택 (질문 게시글의 답변 채택)
export async function selectComment(req, res, next) {
  try {
    const replyId = parseInt(req.params.replyId);
    const boardId = parseInt(req.params.id);
    const userIdx = req.userIdx;

    if (!replyId || isNaN(replyId)) {
      return res
        .status(400)
        .json({ message: "유효하지 않은 댓글 ID입니다." });
    }

    if (!boardId || isNaN(boardId)) {
      return res
        .status(400)
        .json({ message: "유효하지 않은 포스트 ID입니다." });
    }

    // 포스트 존재 및 소유권 확인 (게시글 작성자만 채택 가능)
    const post = await postRepository.getById(boardId);
    if (!post) {
      return res.status(404).json({ message: "포스트를 찾을 수 없습니다." });
    }

    if (post.user_idx !== userIdx) {
      return res
        .status(403)
        .json({ message: "게시글 작성자만 답변을 채택할 수 있습니다." });
    }

    // 댓글 존재 확인
    const comment = await commentRepository.getById(replyId);
    if (!comment) {
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }

    // 댓글이 해당 게시글에 속한 댓글인지 확인
    if (comment.board_id !== boardId) {
      return res
        .status(400)
        .json({ message: "해당 게시글의 댓글이 아닙니다." });
    }

    // 이미 채택된 댓글인지 확인 (선택사항: 중복 채택 방지)
    if (comment.is_selected === 1) {
      return res.status(400).json({
        message: "이미 채택된 답변입니다.",
      });
    }

    // 댓글 채택
    const result = await commentRepository.selectComment(
      replyId,
      boardId,
      userIdx
    );

    // 채택이 성공적으로 이루어졌는지 확인
    if (!result || result.is_selected !== 1) {
      return res.status(500).json({
        message: "댓글 채택에 실패했습니다.",
      });
    }

    // 게시글의 해결 상태를 1로 업데이트 (답변이 채택되었으므로)
    await postRepository.updateSolvedStatus(boardId, true);

    // 답변 작성자에게 알림 생성 (게시글 작성자와 동일인인 경우에도 알림을 줄지 여부는 정책에 따라 결정)
    try {
      if (comment.user_idx && comment.user_idx !== userIdx) {
        await myRepository.createNotification(
          comment.user_idx,
          "COMMENT_SELECTED",
          String(boardId),
          "내 댓글이 채택되었습니다."
        );
      }
    } catch (notiError) {
      console.error("댓글 채택 알림 생성 에러:", notiError);
      // 알림 생성 실패해도 채택은 성공으로 처리
    }

    res.status(200).json({
      message: "답변이 채택되었습니다.",
      comment: toCamelCase(result),
    });
  } catch (error) {
    console.error("댓글 채택 에러:", error);
    res.status(500).json({
      message: "댓글 채택에 실패했습니다.",
      error: error.message,
    });
  }
}

