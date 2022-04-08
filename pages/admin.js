import { useState, useEffect } from "react";
import axios from "axios"
import {
    Box, Button, Heading, Table, Checkbox,
    Text,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableCaption,
    TableContainer,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";


const Admin = () => {
    const blockchain = useSelector(state => state.blockchain);
    const { account, claim20Contract, nftContract } = blockchain;
    const [rankData, setRankData] = useState();
    const [selectedRankData, setSelectedRankData] = useState();
    const [isRankData, setIsRankData] = useState(false);
    const [nextStep, setNextStep] = useState(false)
    const [lastStep, setLastStep] = useState(false)
    const [checkedItems, setCheckedItems] = useState([])

    const allChecked = checkedItems.every(Boolean)
    const isIndeterminate = checkedItems.some(Boolean) && !allChecked


    //랭킹 정보 불러오기
    const importRank = async () => {
        await axios.get("/api/ranks").then(async (rank) => {
            const rankResult = [];
            for (let i = 0; i < rank.data.length; i++) {
                rankResult.push(Object.values(rank.data[i]));
            }
            setRankData(rankResult)
            setIsRankData(true)
        }).catch(console.error());
    }





    // 랭킹정보에 따른 클레임양 일괄 허용
    const approvedAll = async () => {
        await claim20Contract.methods.approveClaim(rankData).send({ from: account }).then(result => {
            console.log(result)
        })

        await axios.post("/api/ranks/deleteRank", { rank: rankData }).then(result => {
            console.log(result);
        }).catch(console.error());
    }

    const selectRankData = async () => {
        let selectedRankData = [];
        console.log(checkedItems)
        console.log(rankData)
        for (let i = 0; i < checkedItems.length; i++) {
            if (checkedItems[i] == true) {
                selectedRankData.push(rankData[i]);
            }
        }
        console.log("selectedRankData", selectedRankData)
        setSelectedRankData(selectedRankData)
        setIsRankData(false)
        setNextStep(true)
    }

    // 랭킹정보에 따른 클레임양 선택 허용
    const approvedSome = async () => {
        console.log("checkedItems", checkedItems)
        //선택한 계정에 한해 클레임 허용
        await claim20Contract.methods.approveClaim(selectedRankData).send({ from: account }).then(result => {
            console.log(result.data);
        })

        // 클레임 허용한 계정 랭킹db에서삭제
        await axios.post("/api/ranks/deleteRank", { rank: selectedRankData }).then(result => {
            console.log(result.data);
            setNextStep(false);
            setLastStep(true);
        }).catch(console.error());
    }

    // 보상자 클레임 요청
    const exportToContract = async () => {
        await claim20Contract.methods.allowance('0xBE005997Cc214577c575cAb11d0430777145a7dd', account).call({ from: account }).then(result => {
            console.log("허용량", result)
        })
        await claim20Contract.methods.rankClaim(account).send({ from: account })

        await claim20Contract.methods.balanceOf(account).call({ from: account }).then(result => {
            console.log("내 토큰 수 : ", result)
        })
        await claim20Contract.methods.allowance('0xBE005997Cc214577c575cAb11d0430777145a7dd', account).call({ from: account }).then(result => {
            console.log("허용량", result)
        })
    }

    const previousStep = () => {
        if (isRankData) {
            setIsRankData(false)
        } else {
            setNextStep(false)
            setIsRankData(true)
        }
    }

    const initStep = () => {
        setNextStep(false)
        setIsRankData(false)
        setLastStep(false)
    }

    useEffect(() => {
        if (!account) return;

    }, [account])

    return (
        <Box w="70vw" bg="blackAlpha.400" margin="0 auto" padding="10" border="2px solid gray" borderRadius="10">
            <Heading>Managing Reward System</Heading>
            <Text mt="5">주간 랭킹 정보를 확인하고 랭킹 정보에 따라 클레임 허용여부를 관리할 수 있습니다.</Text>

            {isRankData ?
                <TableContainer align="center" mt="10">
                    step 2 <br /> 계정 선택
                    <Table border="1px solid gray" mt="5" w="80%">
                        <TableCaption>
                            <Button bg="navy" onClick={previousStep}>뒤로 가기</Button>
                            <Button bg="navy" onClick={selectRankData}>선택 완료</Button>
                        </TableCaption>
                        <Thead bg="navy">
                            <Tr>
                                <Th>
                                    <Checkbox colorScheme='green'
                                        isChecked={allChecked}
                                        isIndeterminate={isIndeterminate}
                                        onChange={(e) => {
                                            let checkedTarget = [];
                                            for (let i = 0; i < rankData.length; i++) {
                                                checkedTarget.push(e.target.checked);
                                            }
                                            setCheckedItems(checkedTarget);
                                        }}
                                    />
                                </Th>
                                <Th>game title</Th>
                                <Th>rank</Th>
                                <Th>score</Th>
                                <Th>address</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {rankData && rankData.map((rank, index) => {
                                return (
                                    <Tr key={index} bg={rank[2] == "블록쌓기" && "whiteAlpha.300"}>
                                        <Td>
                                            <Checkbox colorScheme='green'
                                                isChecked={checkedItems[index]}
                                                onChange={(e) => {
                                                    let checkedTarget2 = [];
                                                    console.log(e.target.checked, "<<<")
                                                    for (let i = 0; i < rankData.length; i++) {
                                                        if (i == index) {
                                                            checkedTarget2.push(e.target.checked);
                                                            continue;
                                                        }
                                                        checkedTarget2.push(checkedItems[i]);
                                                    }
                                                    setCheckedItems(checkedTarget2);
                                                }
                                                }
                                            /></Td>
                                        <Td>{rank[2]}</Td>
                                        <Td>{rank[1]}</Td>
                                        <Td>{rank[3]}</Td>
                                        <Td>{rank[0]}</Td>
                                    </Tr>
                                )
                            })
                            }
                        </Tbody>
                    </Table>
                </TableContainer>
                : nextStep ?
                    <TableContainer align="center" mt="10">
                        step 3 <br /> 클레임 허용
                        <Table border="1px solid gray" mt="5" w="80%">
                            <TableCaption>
                                <Button bg="navy" onClick={previousStep}>뒤로 가기</Button>
                                <Button bg="navy" onClick={approvedSome}>클레임 허용</Button>
                            </TableCaption>
                            <Thead bg="navy">
                                <Tr>
                                    <Th>game title</Th>
                                    <Th>rank</Th>
                                    <Th>score</Th>
                                    <Th>address</Th>
                                    <Th>allowance</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {selectedRankData && selectedRankData.map((rank, index) => {
                                    return (
                                        <Tr key={index} bg={rank[2] == "블록쌓기" && "whiteAlpha.300"}>
                                            <Td>{rank[2]}</Td>
                                            <Td>{rank[1]}</Td>
                                            <Td>{rank[3]}</Td>
                                            <Td>{rank[0]}</Td>
                                            <Td>{rank[1] == 1 ? 100 : rank[1] == 2 ? 50 : 30}</Td>
                                        </Tr>
                                    )
                                })
                                }
                            </Tbody>
                        </Table>
                    </TableContainer>
                    : lastStep ?
                        <Box align="center" mt="10">
                            step 4 <br /> 완료
                            <Box mt="5">
                                <Text mt="5">완료되었습니다.</Text>
                                <Button onClick={initStep}>추가 설정하기</Button>
                            </Box>
                        </Box>
                        :
                        <Box align="center" mt="10">
                            step 1 <br /> 랭크 불러오기
                            <Box mt="5">
                                <Button onClick={importRank}>랭크 불러오기</Button>
                                <Button onClick={exportToContract}>클레임</Button>
                            </Box>
                        </Box>
            }
        </Box>
    )
}

export default Admin