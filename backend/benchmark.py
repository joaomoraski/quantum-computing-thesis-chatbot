#!/usr/bin/env python3
"""
Performance benchmark script for the Thesis Chatbot API
Tests response time improvements after optimization
"""

import asyncio
import time
import statistics
import httpx
import uuid
from typing import List, Tuple

API_URL = "http://localhost:8000"
TEST_QUESTIONS = [
    "O que é computação quântica?",
    "Explique o algoritmo QAOA",
    "Como funciona a função de custo?",
    "Quais são as aplicações práticas?",
]

async def test_single_request(client: httpx.AsyncClient, question: str, session_id: str) -> Tuple[float, bool]:
    """Test a single chat request and measure time"""
    start = time.time()
    
    try:
        async with client.stream(
            "POST",
            f"{API_URL}/chat",
            json={"message": question, "session_id": session_id},
            timeout=30.0
        ) as response:
            first_byte_time = None
            total_chunks = 0
            
            async for chunk in response.aiter_text():
                if first_byte_time is None:
                    first_byte_time = time.time() - start
                total_chunks += 1
            
            total_time = time.time() - start
            
            return (first_byte_time or total_time, total_time, total_chunks, True)
    except Exception as e:
        print(f"❌ Error: {e}")
        return (0, 0, 0, False)

async def run_benchmark():
    """Run comprehensive benchmark tests"""
    print("🚀 Starting Performance Benchmark")
    print("=" * 60)
    
    # Test 1: Health Check
    print("\n📊 Test 1: Health Check")
    async with httpx.AsyncClient() as client:
        start = time.time()
        try:
            response = await client.get(f"{API_URL}/health", timeout=5.0)
            health_time = (time.time() - start) * 1000
            print(f"✅ Health check: {health_time:.1f}ms")
        except Exception as e:
            print(f"❌ Backend not reachable: {e}")
            return
    
    # Test 2: Document Retrieval
    print("\n📄 Test 2: Document Store Check")
    async with httpx.AsyncClient() as client:
        start = time.time()
        try:
            response = await client.get(f"{API_URL}/debug/check-docs", timeout=10.0)
            doc_time = (time.time() - start) * 1000
            print(f"✅ Document check: {doc_time:.1f}ms")
        except Exception as e:
            print(f"❌ Document store error: {e}")
    
    # Test 3: Sequential Requests (measure caching)
    print("\n🔄 Test 3: Sequential Requests (Cache Test)")
    first_token_times = []
    total_times = []
    
    async with httpx.AsyncClient() as client:
        for i, question in enumerate(TEST_QUESTIONS, 1):
            print(f"\n  Request {i}/{len(TEST_QUESTIONS)}: {question[:40]}...")
            
            # Generate valid UUID for session_id
            session_id = str(uuid.uuid4())
            first_byte, total, chunks, success = await test_single_request(
                client, question, session_id
            )
            
            if success:
                first_token_times.append(first_byte * 1000)
                total_times.append(total * 1000)
                print(f"    ⏱️  First token: {first_byte*1000:.0f}ms")
                print(f"    ⏱️  Total time: {total*1000:.0f}ms")
                print(f"    📦 Chunks: {chunks}")
    
    # Test 4: Concurrent Requests (stress test)
    print("\n⚡ Test 4: Concurrent Requests (5 simultaneous)")
    concurrent_times = []
    
    async with httpx.AsyncClient() as client:
        # Generate unique UUIDs for each concurrent request
        tasks = [
            test_single_request(client, TEST_QUESTIONS[i % len(TEST_QUESTIONS)], str(uuid.uuid4()))
            for i in range(5)
        ]
        
        start = time.time()
        results = await asyncio.gather(*tasks)
        concurrent_duration = time.time() - start
        
        successful = [r for r in results if r[3]]
        if successful:
            concurrent_times = [r[1] * 1000 for r in successful]
            print(f"  ✅ All completed in: {concurrent_duration:.1f}s")
            print(f"  ⏱️  Avg response time: {statistics.mean(concurrent_times):.0f}ms")
    
    # Results Summary
    print("\n" + "=" * 60)
    print("📈 PERFORMANCE SUMMARY")
    print("=" * 60)
    
    if first_token_times:
        print(f"\n🎯 First Token Latency:")
        print(f"  • Min:    {min(first_token_times):.0f}ms")
        print(f"  • Max:    {max(first_token_times):.0f}ms")
        print(f"  • Avg:    {statistics.mean(first_token_times):.0f}ms")
        print(f"  • Median: {statistics.median(first_token_times):.0f}ms")
    
    if total_times:
        print(f"\n⏱️  Total Response Time:")
        print(f"  • Min:    {min(total_times):.0f}ms")
        print(f"  • Max:    {max(total_times):.0f}ms")
        print(f"  • Avg:    {statistics.mean(total_times):.0f}ms")
        print(f"  • Median: {statistics.median(total_times):.0f}ms")
    
    if concurrent_times:
        print(f"\n🚀 Concurrent Performance:")
        print(f"  • 5 requests in: {concurrent_duration:.1f}s")
        print(f"  • Avg latency:   {statistics.mean(concurrent_times):.0f}ms")
        print(f"  • Throughput:    {5/concurrent_duration:.1f} req/s")
    
    print("\n" + "=" * 60)
    print("✅ Benchmark Complete!")
    print("\n💡 Tips:")
    print("  • First request is slower (cold start)")
    print("  • Subsequent requests benefit from caching")
    print("  • Concurrent performance shows connection pool efficiency")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_benchmark())
