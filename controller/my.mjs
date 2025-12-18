import * as myRepository from "../data/my.mjs";
import * as likeRepository from "../data/like.mjs";
import * as fileRepository from "../data/file.mjs";
import * as postRepository from "../data/post.mjs";
import * as bcrypt from "bcrypt";
import { config } from "../config.mjs";

// snake_case를 camelCase로 변환하는 헬퍼 함수
function toCamelCase(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  const camelObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    );
    camelObj[camelKey] =
      value instanceof Date
        ? value.toISOString()
        : typeof value === "object" && value !== null
        ? toCamelCase(value)
        : value;
  }
  return camelObj;
}

// 사용자 프로필 조회
export async function getProfile(req, res, next) {
  try {
    const userIdx = req.userIdx;
    const profile = await myRepository.getUserProfile(userIdx);
    const stats = await myRepository.getUserStats(userIdx);

    if (!profile) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // 프론트엔드 호환성을 위해 user_name을 user_id로 매핑
    const profileWithUserId = {
      ...profile,
      user_id: profile.user_name,
    };

    res.status(200).json({
      profile: toCamelCase(profileWithUserId),
      stats: toCamelCase(stats),
    });
  } catch (error) {
    console.error("프로필 조회 에러:", error);
    res
      .status(500)
      .json({ message: "프로필 조회에 실패했습니다.", error: error.message });
  }
}

// 사용자 프로필 업데이트
export async function updateProfile(req, res, next) {
  try {
    const userIdx = req.userIdx;
    const { email, hope_job, password } = req.body;

    // 업로드된 프로필 이미지가 있으면 URL 생성
    // upload.mjs에서 uploads 디렉터리에 저장되고,
    // app.mjs에서 /uploads 경로로 정적 서빙됨
    let profile_image_url;
    if (req.file && req.file.filename) {
      profile_image_url = `/uploads/${req.file.filename}`;
    }

    const updateData = {};
    if (email) updateData.email = email;
    if (hope_job !== undefined) updateData.hope_job = hope_job;
    if (password) {
      updateData.password = bcrypt.hashSync(password, config.bcrypt.saltRounds);
    }
    if (profile_image_url !== undefined) {
      updateData.profile_image_url = profile_image_url;
    }

    const updatedProfile = await myRepository.updateUserProfile(
      userIdx,
      updateData
    );

    // 프론트엔드 호환성을 위해 user_name을 user_id로 매핑
    const profileWithUserId = {
      ...updatedProfile,
      user_id: updatedProfile.user_name,
    };

    res.status(200).json({
      message: "프로필이 성공적으로 업데이트되었습니다.",
      profile: toCamelCase(profileWithUserId),
    });
  } catch (error) {
    console.error("프로필 업데이트 에러:", error);
    res.status(500).json({
      message: "프로필 업데이트에 실패했습니다.",
      error: error.message,
    });
  }
}

// 잔디 데이터 조회
export async function getGrass(req, res, next) {
  try {
    const userIdx = req.userIdx;
    const grassData = await myRepository.getGrassData(userIdx);

    // 프론트엔드 호환성을 위해 user_name을 user_id로 매핑하고 userName 제거
    const grassDataWithUserId = grassData.map((item) => {
      const { user_name, ...rest } = item;
      return {
        ...rest,
        user_id: user_name,
      };
    });

    res.status(200).json({
      grass: toCamelCase(grassDataWithUserId),
    });
  } catch (error) {
    console.error("잔디 데이터 조회 에러:", error);
    res.status(500).json({
      message: "잔디 데이터 조회에 실패했습니다.",
      error: error.message,
    });
  }
}

// 스크랩 토글 (추가/취소)
export async function toggleScrap(req, res, next) {
  try {
    const boardId = parseInt(req.params.id || req.body.boardId);
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

    // 이미 스크랩했는지 확인
    const existingScrap = await myRepository.getScrapByBoardAndUser(
      boardId,
      userIdx
    );

    if (existingScrap) {
      // 스크랩 취소
      await myRepository.deleteScrap(boardId, userIdx);
      res.status(200).json({
        message: "스크랩이 취소되었습니다.",
        isScrapped: false,
      });
    } else {
      // 스크랩 추가
      const scrap = await myRepository.createScrap(boardId, userIdx);
      res.status(200).json({
        message: "스크랩이 추가되었습니다.",
        isScrapped: true,
        scrap: toCamelCase(scrap),
      });
    }
  } catch (error) {
    console.error("스크랩 토글 에러:", error);

    // 중복 키 에러 처리 (동시 요청 시 발생할 수 있음)
    if (error.code === "ER_DUP_ENTRY") {
      // 이미 스크랩된 상태이므로 취소 처리
      try {
        await myRepository.deleteScrap(
          parseInt(req.params.id || req.body.boardId),
          req.userIdx
        );
        return res.status(200).json({
          message: "스크랩이 취소되었습니다.",
          isScrapped: false,
        });
      } catch (deleteError) {
        return res.status(409).json({
          message: "이미 스크랩한 포스트입니다.",
        });
      }
    }

    res.status(500).json({
      message: "스크랩 처리에 실패했습니다.",
      error: error.message,
    });
  }
}

// 스크랩 조회
export async function getScraps(req, res, next) {
  try {
    const userIdx = req.userIdx;
    const scraps = await myRepository.getScraps(userIdx);

    // 스크랩이 없는 경우 빈 배열 반환
    if (!scraps || scraps.length === 0) {
      return res.status(200).json({
        scraps: [],
      });
    }

    // 여러 게시글의 좋아요 개수를 한 번에 조회
    const boardIds = scraps.map((scrap) => scrap.board_id);
    const likeCounts = await likeRepository.getLikeCountsByBoardIds(
      "post",
      boardIds
    );

    // 각 포스트의 파일 목록 조회
    const filesMap = {};
    for (const boardId of boardIds) {
      try {
        const files = await fileRepository.getFilesByBoardId("post", boardId);
        filesMap[boardId] = files || [];
      } catch (error) {
        console.error(`파일 조회 실패 (board_id: ${boardId}):`, error);
        filesMap[boardId] = [];
      }
    }

    // 프론트엔드 호환성을 위해 user_name을 user_id로 매핑하고 상세 정보 추가
    const scrapsWithDetails = await Promise.all(
      scraps.map(async (item) => {
        const files = filesMap[item.board_id] || [];

        // 각 파일에 isMainImage 플래그 추가
        const filesWithMainFlag = files.map((file) => {
          const fileObj = toCamelCase(file);
          fileObj.isMainImage = file.file_key === item.main_image_id;
          return fileObj;
        });

        const scrapData = {
          ...item,
          likeCount: likeCounts[item.board_id] || 0,
          files: filesWithMainFlag,
          mainImageId: item.main_image_id,
        };
        return scrapData;
      })
    );

    res.status(200).json({
      scraps: toCamelCase(scrapsWithDetails),
    });
  } catch (error) {
    console.error("스크랩 조회 에러:", error);
    res.status(500).json({
      message: "스크랩 조회에 실패했습니다.",
      error: error.message,
    });
  }
}

// 알림 조회
export async function getNotifications(req, res, next) {
  try {
    const userIdx = req.userIdx;
    const notifications = await myRepository.getNotifications(userIdx);

    // 프론트엔드 호환성을 위해 user_name을 user_id로 매핑
    const notificationsWithUserId = notifications.map((item) => ({
      ...item,
      user_id: item.user_name,
    }));

    res.status(200).json({
      notifications: toCamelCase(notificationsWithUserId),
    });
  } catch (error) {
    console.error("알림 조회 에러:", error);
    res.status(500).json({
      message: "알림 조회에 실패했습니다.",
      error: error.message,
    });
  }
}

// 알림을 읽음으로 표시
export async function markNotificationRead(req, res, next) {
  try {
    const userIdx = req.userIdx;
    const notiId = req.params.id;

    const success = await myRepository.markNotificationAsRead(notiId, userIdx);

    if (!success) {
      return res.status(404).json({ message: "알림을 찾을 수 없습니다." });
    }

    res.status(200).json({
      message: "알림이 읽음으로 표시되었습니다.",
    });
  } catch (error) {
    console.error("알림 읽음 처리 에러:", error);
    res.status(500).json({
      message: "알림 읽음 처리에 실패했습니다.",
      error: error.message,
    });
  }
}

// 알림 삭제
export async function deleteNotification(req, res, next) {
  try {
    const userIdx = req.user_idx;
    const notiId = req.params.id;

    const success = await myRepository.deleteNotification(notiId, userIdx);

    if (!success) {
      return res.status(404).json({ message: "알림을 찾을 수 없습니다." });
    }

    res.status(200).json({
      message: "알림이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("알림 삭제 에러:", error);
    res.status(500).json({
      message: "알림 삭제에 실패했습니다.",
      error: error.message,
    });
  }
}
