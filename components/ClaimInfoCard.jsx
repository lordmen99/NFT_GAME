import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Flex } from "@chakra-ui/react";
import axios from "axios";
import ClaimHistory from "./mypage/ClaimHistory";
import MissionClaimCard from "./mypage/MissionClaimCard";
import RankingClaimCard from "./mypage/RankingClaimCard";

const ClaimInfoCard = () => {
  const blockchain = useSelector((state) => state.blockchain);
  const { account, claim20_Contract } = blockchain;

  const [rewardAmount_rank, setRewardAmount_rank] = useState(0);
  const [rewardAmount_mission, setRewardAmount_mission] = useState(0);
  const [claimableRank, setClaimableRank] = useState([]);
  const [claimableMission, setClaimableMission] = useState([]);
  const [claimHistory, setClaimHistory] = useState();

  // 보상 수량 조회
  const getRewardAmount = async () => {
    await axios
      .post("/api/users/claimable-rank", { data: account })
      .then((rank) => {
        console.log(rank);
        let rewardData = [];
        let rankRewardAmount = 0;
        for (let i = 0; i < rank.data.length; i++) {
          console.log(rank.data.ranking);
          if (rank.data[i].ranking == 1) {
            rankRewardAmount += 100;
          } else if (rank.data[i].ranking == 2) {
            rankRewardAmount += 50;
          } else if (rank.data[i].ranking == 3) {
            rankRewardAmount += 30;
          }
          rewardData.push(Object.values(rank.data[i]));
        }
        setRewardAmount_rank(rankRewardAmount);
        setClaimableRank(rewardData);
      });

    await axios
      .post("/api/users/claimable-mission", { data: account })
      .then((mission) => {
        console.log(mission);
        let missionRewardData = [];
        for (let i = 0; i < mission.data.length; i++) {
          missionRewardData.push(Object.values(mission.data[i]));
        }

        setRewardAmount_mission(mission.data.length * 10);
        setClaimableMission(missionRewardData);
      });
  };

  // 클레임 히스토리 조회
  const getClaimHistory = async () => {
    await claim20_Contract
      .getPastEvents("ClaimEvent", {
        filter: { account: account },
        fromBlock: 0,
        toBlock: "latest",
      })
      .then((res) => {
        console.log(res);
        let returnValuesArr = [];
        for (const history of res) {
          returnValuesArr.push({
            value: history.returnValues,
            tx: history.transactionHash,
          });
        }
        setClaimHistory(returnValuesArr);
      })
      .catch(console.error);
  };

  useEffect(async () => {
    if (!account) return;
    await getRewardAmount();
    await getClaimHistory();
    console.log(account);
    console.log(claim20_Contract);
    return () => setRewardAmount(0);
  }, [account]);
  // useEffect(async () => {
  //   if (!account || !claimHistory) return;
  //   console.log(claimHistory[0].value.rewardType);
  // }, [account, claimHistory]);

  return (
    <>
      <Flex justify="center">
        <RankingClaimCard
          claimInfo={claimableRank}
          reward={rewardAmount_rank}
          updateReward={getRewardAmount}
        />
        <MissionClaimCard
          claimInfo={claimableMission}
          reward={rewardAmount_mission}
          updateReward={getRewardAmount}
        />
      </Flex>
      <ClaimHistory history={claimHistory} updateHistory={getClaimHistory} />
    </>
  );
};

export default ClaimInfoCard;
