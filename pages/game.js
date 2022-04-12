import { Box, Flex, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import GameCard from "../components/game/GameCard";
import GameInterface from "../components/game/GameInterface";
import { useRouter } from "next/router";
import Link from "next/link";

const Game = () => {
  const blockchain = useSelector((state) => state.blockchain);
  const { account, auth, nftContract } = blockchain;
  const router = useRouter();
  const [mainNFT, setMainNFT] = useState("");
  const [dailyMission, setDailyMission] = useState([]);

  // 페이지 진입 시 대표 NFT 받아오기
  useEffect(async () => {
    if (!(account && auth)) return;
    const mainNFT = await GameInterface.getMyNFT(account);
    setMainNFT(mainNFT);
  }, [account, auth]);

  useEffect(async () => {
    if (!(account && auth && mainNFT)) return;
    //

    // 대표 NFT가 있으면 일일미션정보 받아오기
    let receivedMissions = await GameInterface.getMission(account);
    // 일일미션이 없으면 새로 받기
    if (receivedMissions.length == 0) {
      await GameInterface.missionReg(account, mainNFT);
      receivedMissions = await GameInterface.getMission(account);
    }
    setDailyMission(receivedMissions);
  }, [mainNFT]);

  const selectGame = async (game) => {
    // 메타마스크, 홈페이지 로그인 확인
    if (!(account && auth)) {
      alert("로그인 안하시면 게임 안 시켜줄겁니다");
      return false;
    }
    // NFT 홀더 확인
    const haveToken = await nftContract.methods.haveTokenBool(account).call({ from: account });
    if (!haveToken) {
      alert("NFT를 가지고 있지 않습니다. \n 민팅하고 대표NFT를 설정해주세요.");
      return false;
    }
    // 대표 NFT 설정 확인(설정 안되있으면 mypage로 보내기)
    if (!mainNFT) {
      alert("대표 NFT를 설정해주세요");
      router.push(`mypage`);
      return false;
    }
    const selectedGame = game.gameUrl;
    console.log("selectedGame", game.gameUrl);
    if (window.confirm(`${game.description}\n게임을 플레이 하시겠습니까?`)) {
      // 선택한 게임을 useState에 담아 실행중임을 표시
      console.log("selectedGameselectedGame", selectedGame);

      router.push(`game/${selectedGame}`);
      return true;
    }
  };

  return (
    <Flex direction={"column"}>
      <Box w={"100%"} textAlign="center" height={"150px"}>
        {dailyMission.length != 0 && (
          <>
            <Text>오늘 밋숀</Text>
            <Flex justifyContent={"center"}>
              {dailyMission.map((mission, index) => {
                return (
                  <Flex
                    key={index}
                    direction="column"
                    m="10px"
                    p="10px"
                    backgroundColor={mission.attainment ? "#ffff00a1" : "yellow"}
                    color={mission.attainment ? "#c3c3c3" : "#000428"}
                    fontWeight="bold"
                    borderRadius={"10px"}
                  >
                    <Box>{mission.DailyMission.game_title}</Box>
                    <Box>{mission.DailyMission.missionDetails}</Box>
                    <Box>{mission.attainment ? "완료!" : "안완료!"}</Box>
                  </Flex>
                );
              })}
            </Flex>
          </>
        )}
      </Box>
      <Box w={"100%"} minHeight={"400px"} position={`relative`}>
        <Flex justifyContent={"space-evenly"}>
          {
            GameInterface.gameList.map((game, index) => (
              <Link key={index} href={(() => selectGame(game)) == true ? `/game/${game.gameUrl}` : `/game`}>
                <a onClick={() => selectGame(game)} style={{ width: "30%", height: "100%" }}>
                  <GameCard game={game} />
                </a>
              </Link>
            ))
          }
        </Flex >
      </Box >
    </Flex >
  );
};
export default Game;